import { useEffect, useRef, useState } from "react";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { useMemberAvatarSrc } from "../hooks/useMemberAvatarSrc.js";
import { isApiWorkerConfigured } from "../lib/config.js";
import { createMemberProfileViaWorker } from "../lib/supabase.js";
import { useFocusTrap } from "./useFocusTrap.js";
import { formatHandleDisplay, normalizeHandleInput } from "../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";

function initialLetter(displayName) {
  const s = String(displayName || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

/**
 * Bottom-right profile switcher (above main nav). Does not alter other layout.
 * @param {{
 *   onOpenUpgrade?: (reason?: string) => void,
 *   onGoToProfileSettings?: () => void,
 *   navTooltipAnchorRef?: (el: HTMLDivElement | null) => void,
 * }} props
 */
export function ProfileSwitcher({ onOpenUpgrade, onGoToProfileSettings, navTooltipAnchorRef }) {
  const demo = useDemoTourOptional();
  const {
    activeProfileId,
    activeProfile,
    memberProfiles,
    memberProfilesVersion,
    switchProfile,
    canAddProfile,
    refreshMemberProfiles,
  } = useActiveProfile();
  const workerOk = isApiWorkerConfigured();
  const avatarUserId =
    (typeof activeProfile?.user_id === "string" && activeProfile.user_id) ||
    (typeof memberProfiles[0]?.user_id === "string" && memberProfiles[0].user_id) ||
    "";
  const floatingAvatarSrc = useMemberAvatarSrc(
    avatarUserId,
    activeProfile?.avatar_url,
    memberProfilesVersion,
    workerOk
  );
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState(null);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function submitAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    setErr(null);
    const { profile, error } = await createMemberProfileViaWorker(name);
    setAdding(false);
    if (error) {
      if (error.message === "Upgrade your plan to add more profiles") {
        setErr(error.message);
        onOpenUpgrade?.("profile_slots");
      } else {
        setErr(error.message || "Could not add profile");
      }
      return;
    }
    setNewName("");
    setOpen(false);
    await refreshMemberProfiles();
    if (profile?.id) switchProfile(profile.id);
  }

  const label = activeProfile?.display_name || "Profile";

  return (
    <div
      style={{
        position: "fixed",
        right: 14,
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Profiles"
          style={{
            width: "min(280px, calc(100vw - 28px))",
            maxHeight: "min(320px, 45vh)",
            overflowY: "auto",
            background: "#0b0f17",
            border: "1px solid #1e2a38",
            borderRadius: 14,
            padding: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: "1px solid #1a2430",
            }}
          >
            <button
              type="button"
              disabled={!normalizeHandleInput(activeProfile?.handle ?? "")}
              title={
                normalizeHandleInput(activeProfile?.handle ?? "")
                  ? "Open your public page"
                  : "Set a handle in Profile & account first"
              }
              onClick={() => {
                const h = normalizeHandleInput(activeProfile?.handle ?? "");
                if (!h) return;
                setOpen(false);
                openPublicMemberProfile(h);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #243040",
                background: "rgba(0, 212, 170, 0.08)",
                color: "#00d4aa",
                cursor: normalizeHandleInput(activeProfile?.handle ?? "") ? "pointer" : "not-allowed",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                opacity: normalizeHandleInput(activeProfile?.handle ?? "") ? 1 : 0.45,
              }}
            >
              My Public Page
            </button>
            {typeof onGoToProfileSettings === "function" ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onGoToProfileSettings();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #243040",
                  background: "rgba(255,255,255,0.03)",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                }}
              >
                Profile & account
              </button>
            ) : null}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "#5c6d82", letterSpacing: "0.1em", marginBottom: 8 }}>
            PROFILES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memberProfiles.map((p) => {
              const active = p.id === activeProfileId;
              const canon = normalizeHandleInput(p.handle ?? "");
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: active ? "2px solid rgba(0, 212, 170, 0.65)" : "1px solid #243040",
                    background: active ? "rgba(0, 212, 170, 0.1)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      switchProfile(p.id);
                      setOpen(false);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      padding: 0,
                      border: "none",
                      borderRadius: 0,
                      background: "transparent",
                      color: "#dde4ef",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#14202e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "#00d4aa",
                        flexShrink: 0,
                      }}
                    >
                      {initialLetter(p.display_name)}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 2,
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {p.display_name}
                      </span>
                    </span>
                  </button>
                  {canon ? (
                    <button
                      type="button"
                      className="mono"
                      onClick={() => {
                        setOpen(false);
                        openPublicMemberProfile(canon);
                      }}
                      style={{
                        fontSize: 11,
                        color: "#00d4aa",
                        opacity: 0.9,
                        flexShrink: 0,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 2px",
                        maxWidth: 108,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title="View public profile"
                    >
                      {formatHandleDisplay(p.handle, p.display_handle)}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {canAddProfile && (
            <form onSubmit={(e) => void submitAdd(e)} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a2632" }}>
              <div className="mono" style={{ fontSize: 11, color: "#5c6d82", letterSpacing: "0.08em", marginBottom: 6 }}>
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
              {err && (
                <div className="mono" style={{ fontSize: 12, color: "#f59e0b", marginBottom: 8 }}>
                  {err}
                </div>
              )}
              <button type="submit" className="btn-teal" style={{ width: "100%", fontSize: 13 }} disabled={adding || !newName.trim()}>
                {adding ? "…" : "Add profile"}
              </button>
            </form>
          )}
        </div>
      )}

      <div
        ref={(el) => {
          btnRef.current = el;
          navTooltipAnchorRef?.(el);
        }}
        data-demo-target={DEMO_TARGET.nav_profile}
        {...demoHighlightProps(Boolean(demo?.isHighlighted(DEMO_TARGET.nav_profile)))}
        role="group"
        aria-label="Profile switcher"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderRadius: 999,
          border: "1px solid #1e2a38",
          background: "rgba(10, 14, 22, 0.92)",
          backdropFilter: "blur(8px)",
          color: "#dde4ef",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          maxWidth: "min(220px, calc(100vw - 28px))",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="dialog"
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px 8px 10px",
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#14202e",
              border: activeProfileId ? "2px solid rgba(0, 212, 170, 0.5)" : "2px solid #243040",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#00d4aa",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {floatingAvatarSrc ? (
              <img
                src={floatingAvatarSrc}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              initialLetter(label)
            )}
          </span>
          <span
            style={{
              overflow: "hidden",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              minWidth: 0,
              gap: 2,
              flex: "1 1 auto",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{label}</span>
          </span>
        </button>
        {typeof activeProfile?.handle === "string" && normalizeHandleInput(activeProfile.handle) ? (
          <button
            type="button"
            className="mono"
            onClick={() => {
              setOpen(false);
              openPublicMemberProfile(activeProfile.handle);
            }}
            style={{
              fontSize: 11,
              color: "#00d4aa",
              opacity: 0.9,
              lineHeight: 1.2,
              flexShrink: 0,
              border: "none",
              borderLeft: "1px solid #243040",
              background: "transparent",
              cursor: "pointer",
              padding: "8px 10px",
              maxWidth: 96,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title="View public profile"
            aria-label={`View public profile ${formatHandleDisplay(activeProfile.handle, activeProfile.display_handle)}`}
          >
            {formatHandleDisplay(activeProfile.handle, activeProfile.display_handle)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
