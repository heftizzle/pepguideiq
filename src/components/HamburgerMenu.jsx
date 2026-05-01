import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";
import { useMemberAvatarSrc } from "../hooks/useMemberAvatarSrc.js";
import { isApiWorkerConfigured } from "../lib/config.js";
import { formatHandleDisplay, normalizeHandleInput } from "../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import { createMemberProfileViaWorker } from "../lib/supabase.js";
import { getTier, tierAccentCssVar } from "../lib/tiers.js";
import { ThemeToggle } from "./ThemeToggle.jsx";

function initialLetter(displayName) {
  const s = String(displayName || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

const rowBtnStyle = {
  width: "100%",
  minHeight: 44,
  padding: "10px 14px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--color-text-primary)",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 15,
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  boxSizing: "border-box",
};

const sectionDividerStyle = {
  height: 1,
  margin: "4px 0",
  background: "var(--color-border-hairline)",
  border: "none",
  flexShrink: 0,
};

/**
 * Top-right hamburger: opens account / settings drawer.
 * @param {{
 *   user: import("@supabase/supabase-js").User,
 *   onOpenProfile: () => void,
 *   onOpenSettings: () => void,
 *   onOpenFindPeople: () => void,
 *   onOpenUpgrade: (reason?: string) => void,
 *   onOpenGlossary: () => void,
 *   onOpenFAQ: () => void,
 *   onOpenTutorials: () => void,
 *   onOpenSupport: () => void,
 *   onOpenLegal: () => void,
 *   onSignOut: () => void | Promise<void>,
 *   navTabButtonRef?: (el: HTMLButtonElement | null) => void,
 * }} props
 */
export function HamburgerMenu({
  user,
  onOpenProfile,
  onOpenFindPeople,
  onOpenUpgrade,
  onOpenGlossary,
  onOpenFAQ,
  onOpenTutorials,
  onOpenSupport,
  onOpenLegal,
  onSignOut,
  navTabButtonRef,
}) {
  const tutorial = useTutorialOptional();
  const {
    activeProfileId,
    activeProfile,
    memberProfiles,
    switchProfile,
    canAddProfile,
    refreshMemberProfiles,
  } = useActiveProfile();

  const [open, setOpen] = useState(false);
  const [switchExpanded, setSwitchExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addErr, setAddErr] = useState(/** @type {string | null} */ (null));

  const workerOk = isApiWorkerConfigured();
  const rawKey = activeProfile && typeof activeProfile.avatar_r2_key === "string" ? activeProfile.avatar_r2_key.trim() : "";
  const rawLegacy =
    activeProfile && typeof activeProfile.avatar_url === "string" ? activeProfile.avatar_url.trim() : "";
  const avatarSrc = useMemberAvatarSrc(user?.id ?? "", rawKey, rawLegacy, workerOk);

  const plan = typeof user?.plan === "string" ? user.plan : "entry";
  const tier = getTier(plan);
  const tierColor = tierAccentCssVar(plan);
  const displayName = String(activeProfile?.display_name ?? "").trim() || "—";
  const handleCanon = normalizeHandleInput(activeProfile?.handle ?? "");
  const handleShown = handleCanon ? formatHandleDisplay(activeProfile.handle, activeProfile.display_handle) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSwitchExpanded(false);
      setNewName("");
      setAddErr(null);
    }
  }, [open]);

  const closeAnd = (fn) => {
    setOpen(false);
    fn();
  };

  async function submitAddProfile(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    setAddErr(null);
    const { profile, error } = await createMemberProfileViaWorker(name);
    setAdding(false);
    if (error) {
      if (error.message === "Upgrade your plan to add more profiles") {
        setAddErr(error.message);
        onOpenUpgrade("profile_slots");
      } else {
        setAddErr(error.message || "Could not add profile");
      }
      return;
    }
    setNewName("");
    setOpen(false);
    await refreshMemberProfiles();
    if (profile?.id) switchProfile(profile.id);
  }

  const portal =
    typeof document !== "undefined" &&
    createPortal(
      <>
        <div
          className="pepv-hamburger-overlay"
          data-open={open ? "true" : "false"}
          role="presentation"
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />
        <aside
          className="pepv-hamburger-drawer"
          data-open={open ? "true" : "false"}
          aria-hidden={!open}
          aria-label="Account menu"
        >
          <div className="pepv-hamburger-drawer__topbar">
            <div className="pepv-hamburger-drawer__identity">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  draggable={false}
                  className="pepv-hamburger-drawer__avatar-img"
                />
              ) : (
                <span className="pepv-hamburger-drawer__avatar-fallback" aria-hidden>
                  {initialLetter(displayName)}
                </span>
              )}
              <div className="pepv-hamburger-drawer__identity-text">
                <div className="pepv-hamburger-drawer__name-row">
                  <span className="pepv-hamburger-drawer__display mono">{displayName}</span>
                  <span className="pepv-hamburger-drawer__tier-badge" style={{ color: tierColor }}>
                    <span aria-hidden>{tier.emoji}</span> {tier.name}
                  </span>
                </div>
                {handleShown ? (
                  <div className="pepv-hamburger-drawer__handle mono">{handleShown}</div>
                ) : (
                  <div className="pepv-hamburger-drawer__handle mono" style={{ opacity: 0.55 }}>
                    No public handle yet
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="pepv-hamburger-drawer__close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="pepv-hamburger-drawer__scroll">
            <hr style={sectionDividerStyle} />

            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenProfile)}>
              Profile
            </button>
            <button
              type="button"
              className="pepv-hamburger-row"
              style={{
                ...rowBtnStyle,
                opacity: handleCanon ? 1 : 0.45,
                cursor: handleCanon ? "pointer" : "not-allowed",
              }}
              disabled={!handleCanon}
              onClick={() => {
                if (!handleCanon) return;
                closeAnd(() => openPublicMemberProfile(handleCanon));
              }}
            >
              View as Public
            </button>
            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenFindPeople)}>
              Find People
            </button>

            <button
              type="button"
              className="pepv-hamburger-row pepv-hamburger-row--switch"
              style={rowBtnStyle}
              onClick={() => setSwitchExpanded((v) => !v)}
              aria-expanded={switchExpanded}
            >
              <span>Switch Profile</span>
              <span aria-hidden style={{ fontSize: 12, opacity: 0.8 }}>
                {switchExpanded ? "▾" : "▸"}
              </span>
            </button>
            {switchExpanded ? (
              <div
                style={{
                  padding: "4px 12px 12px",
                  borderBottom: "1px solid var(--color-border-hairline)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {memberProfiles.map((p) => {
                    const active = p.id === activeProfileId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (!active) switchProfile(p.id);
                          setOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minHeight: 44,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: active ? "2px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                          background: active ? "var(--color-accent-dim)" : "var(--color-bg-hover)",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--color-surface-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            color: "var(--color-accent)",
                            flexShrink: 0,
                            fontSize: 13,
                          }}
                        >
                          {initialLetter(p.display_name)}
                        </span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {p.display_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {canAddProfile ? (
                  <form onSubmit={(e) => void submitAddProfile(e)} style={{ marginTop: 12 }}>
                    <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", letterSpacing: "0.08em", marginBottom: 6 }}>
                      ADD PROFILE
                    </div>
                    <input
                      className="form-input"
                      style={{ width: "100%", fontSize: 13, marginBottom: 8 }}
                      placeholder="Display name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={adding}
                    />
                    {addErr ? (
                      <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginBottom: 8 }}>
                        {addErr}
                      </div>
                    ) : null}
                    <button type="submit" className="btn-teal" style={{ width: "100%", fontSize: 13 }} disabled={adding || !newName.trim()}>
                      {adding ? "…" : "Add profile"}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn-teal"
                    style={{ width: "100%", fontSize: 13, marginTop: 12, opacity: 0.95 }}
                    onClick={() => closeAnd(() => onOpenUpgrade("profile_slots"))}
                  >
                    Upgrade to add profiles
                  </button>
                )}
              </div>
            ) : null}

            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenSettings)}>
              Settings
            </button>

            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(() => onOpenUpgrade())}>
              Plan / Upgrade
            </button>

            <hr style={sectionDividerStyle} />

            <div className="pepv-hamburger-row pepv-hamburger-row--theme" style={{ ...rowBtnStyle, cursor: "default" }}>
              <span>Theme</span>
              <ThemeToggle />
            </div>
            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenGlossary)}>
              Peptide Glossary
            </button>

            <hr style={sectionDividerStyle} />

            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenTutorials)}>
              Tutorials
            </button>
            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenFAQ)}>
              FAQ
            </button>
            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenLegal)}>
              Legal / Privacy
            </button>
            <button type="button" className="pepv-hamburger-row" style={rowBtnStyle} onClick={() => closeAnd(onOpenSupport)}>
              Support
            </button>

            <hr style={sectionDividerStyle} />

            <button
              type="button"
              className="pepv-hamburger-row pepv-hamburger-row--danger"
              style={{ ...rowBtnStyle, color: "var(--color-text-danger)" }}
              onClick={() => closeAnd(() => void onSignOut())}
            >
              Sign Out
            </button>
          </div>
        </aside>
      </>,
      document.body
    );

  return (
    <>
      <button
        ref={(el) => navTabButtonRef?.(el)}
        type="button"
        className="pepv-hamburger-trigger pepv-header-action-btn pepv-header-action-btn--icon"
        data-tutorial-target={TUTORIAL_TARGET.nav_profile}
        {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.nav_profile)))}
        aria-label="Open account menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>
          ≡
        </span>
      </button>
      {portal}
    </>
  );
}
