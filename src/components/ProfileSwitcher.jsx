import { useEffect, useRef, useState } from "react";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { createMemberProfileViaWorker } from "../lib/supabase.js";
import { useFocusTrap } from "./useFocusTrap.js";

function initialLetter(displayName) {
  const s = String(displayName || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

/**
 * Bottom-right profile switcher (above main nav). Does not alter other layout.
 * @param {{ onOpenUpgrade?: () => void }} props
 */
export function ProfileSwitcher({ onOpenUpgrade }) {
  const {
    activeProfileId,
    activeProfile,
    memberProfiles,
    switchProfile,
    canAddProfile,
    refreshMemberProfiles,
  } = useActiveProfile();
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
        onOpenUpgrade?.();
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
          <div className="mono" style={{ fontSize: 11, color: "#5c6d82", letterSpacing: "0.1em", marginBottom: 8 }}>
            PROFILES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memberProfiles.map((p) => {
              const active = p.id === activeProfileId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    switchProfile(p.id);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: active ? "2px solid rgba(0, 212, 170, 0.65)" : "1px solid #243040",
                    background: active ? "rgba(0, 212, 170, 0.1)" : "rgba(255,255,255,0.03)",
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
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.display_name}
                  </span>
                </button>
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

      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px 8px 10px",
          borderRadius: 999,
          border: "1px solid #1e2a38",
          background: "rgba(10, 14, 22, 0.92)",
          backdropFilter: "blur(8px)",
          color: "#dde4ef",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          maxWidth: "min(220px, calc(100vw - 28px))",
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
          }}
        >
          {initialLetter(label)}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{label}</span>
      </button>
    </div>
  );
}
