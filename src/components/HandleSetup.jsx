import { useCallback, useEffect, useMemo, useState } from "react";
import { isApiWorkerConfigured } from "../lib/config.js";
import { MEMBER_HANDLE_PATTERN, stripHandleAtPrefix } from "../lib/memberProfileHandle.js";
import {
  checkMemberProfileHandleAvailable,
  patchMemberProfileViaWorker,
  supabase,
  updateMemberProfile,
} from "../lib/supabase.js";

/**
 * @param {string} raw
 */
function normalizeHandleDraft(raw) {
  return stripHandleAtPrefix(String(raw ?? "")).toLowerCase();
}

/**
 * When Worker URL is not configured, check uniqueness via Supabase (exclude current profile row).
 * @param {string} handle
 * @param {string} profileId
 */
async function checkHandleAvailableDirect(handle, profileId) {
  if (!supabase) return { available: false, error: new Error("Not configured") };
  let q = supabase.from("member_profiles").select("id").eq("handle", handle).limit(1);
  if (profileId) q = q.neq("id", profileId);
  const { data, error } = await q.maybeSingle();
  if (error && error.code !== "PGRST116") {
    return { available: false, error: new Error(error.message || "Could not check handle") };
  }
  return { available: !data, error: null };
}

/**
 * @param {{ activeProfileId: string; patchMemberProfileLocal: (id: string, patch: Record<string, unknown>) => void; onComplete: () => void }} props
 */
const PENDING_CORE_TUTORIAL_KEY = "pepv_pending_core_tutorial";

export function HandleSetup({ activeProfileId, patchMemberProfileLocal, onComplete }) {
  const [draft, setDraft] = useState("");
  const [handleCelebrate, setHandleCelebrate] = useState(false);
  /** idle | checking | available | taken | error */
  const [avail, setAvail] = useState(/** @type {"idle" | "checking" | "available" | "taken" | "error"} */ ("idle"));
  const [availError, setAvailError] = useState(/** @type {string | null} */ (null));
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [saveError, setSaveError] = useState(/** @type {string | null} */ (null));

  const canonical = useMemo(() => normalizeHandleDraft(draft), [draft]);

  const formatError = useMemo(() => {
    if (!canonical) return null;
    if (!MEMBER_HANDLE_PATTERN.test(canonical)) {
      return "Start with a letter; 3–30 characters; letters, numbers, underscore, or hyphen only.";
    }
    return null;
  }, [canonical]);

  useEffect(() => {
    if (formatError || !canonical) {
      setAvail("idle");
      setAvailError(null);
      return;
    }
    let cancelled = false;
    setAvail("checking");
    setAvailError(null);
    const t = window.setTimeout(async () => {
      try {
        let available = false;
        /** @type {Error | null} */
        let err = null;
        if (isApiWorkerConfigured()) {
          const r = await checkMemberProfileHandleAvailable(canonical, activeProfileId);
          err = r.error;
          available = Boolean(r.available);
          if (!err && r.reason === "reserved") {
            if (cancelled) return;
            setAvail("taken");
            setAvailError("That handle is reserved.");
            return;
          }
        } else {
          const r = await checkHandleAvailableDirect(canonical, activeProfileId);
          err = r.error;
          available = Boolean(r.available);
        }
        if (cancelled) return;
        if (err) {
          setAvail("error");
          setAvailError(err.message || "Could not verify handle");
          return;
        }
        setAvail(available ? "available" : "taken");
        setAvailError(null);
      } catch (e) {
        if (cancelled) return;
        setAvail("error");
        setAvailError(e instanceof Error ? e.message : "Could not verify handle");
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [canonical, formatError, activeProfileId]);

  const onChange = useCallback((e) => {
    setSaveError(null);
    setDraft(e.target.value);
  }, []);

  const canConfirm =
    !formatError &&
    MEMBER_HANDLE_PATTERN.test(canonical) &&
    avail === "available" &&
    !confirmBusy &&
    avail !== "checking";

  const onConfirm = useCallback(async () => {
    if (!formatError && MEMBER_HANDLE_PATTERN.test(canonical) && avail === "available" && !confirmBusy) {
      // use guard inline to avoid stale canConfirm
    } else {
      return;
    }
    setConfirmBusy(true);
    setSaveError(null);
    const h = canonical;
    try {
      /** @type {{ error: Error | null }} */
      let res;
      if (isApiWorkerConfigured()) {
        res = await patchMemberProfileViaWorker(activeProfileId, { handle: h, display_handle: h });
      } else {
        res = await updateMemberProfile(activeProfileId, { handle: h, display_handle: h });
      }
      if (res.error) {
        setSaveError(res.error.message || "Could not save handle");
        setConfirmBusy(false);
        return;
      }
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(PENDING_CORE_TUTORIAL_KEY, "1");
        }
      } catch {
        /* ignore */
      }
      patchMemberProfileLocal(activeProfileId, { handle: h, display_handle: h });
      setHandleCelebrate(true);
      setConfirmBusy(false);
      window.setTimeout(() => {
        onComplete();
      }, 800);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save handle");
    } finally {
      setConfirmBusy(false);
    }
  }, [activeProfileId, avail, canonical, confirmBusy, formatError, onComplete, patchMemberProfileLocal]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--color-bg-page)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--color-bg-sunken)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 10,
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        {handleCelebrate ? (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-accent-nav-border)",
              background: "var(--color-accent-nav-fill)",
              textAlign: "center",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.45,
            }}
          >
            Handle set! Let’s show you around.
          </div>
        ) : null}
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", letterSpacing: ".18em", marginBottom: 8, textAlign: "center" }}>
          CHOOSE YOUR HANDLE
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
            fontFamily: "'Outfit',sans-serif",
            textAlign: "center",
          }}
        >
          This is your public identity on PepGuideIQ
        </p>
        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
            HANDLE
          </div>
          <input
            className="form-input"
            style={{ width: "100%", boxSizing: "border-box" }}
            value={draft}
            placeholder="yourhandle"
            onChange={onChange}
            autoComplete="username"
            spellCheck={false}
            aria-invalid={Boolean(formatError)}
            aria-describedby={formatError ? "pepv-handle-setup-format-err" : undefined}
          />
        </div>
        {formatError ? (
          <div id="pepv-handle-setup-format-err" className="mono" style={{ fontSize: 12, color: "var(--color-danger)", marginBottom: 12, lineHeight: 1.45 }}>
            {formatError}
          </div>
        ) : null}
        {!formatError && canonical.length > 0 ? (
          <div
            className="mono"
            style={{
              fontSize: 13,
              marginBottom: 16,
              minHeight: 22,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-text-secondary)",
            }}
          >
            {avail === "checking" ? (
              <span>Checking…</span>
            ) : avail === "available" ? (
              <>
                <span style={{ color: "var(--color-text-success)", fontSize: 16 }} aria-hidden>
                  ✓
                </span>
                <span style={{ color: "var(--color-text-success)" }}>Available</span>
              </>
            ) : avail === "taken" ? (
              <>
                <span style={{ color: "var(--color-danger)", fontSize: 16 }} aria-hidden>
                  ✕
                </span>
                <span style={{ color: "var(--color-danger)" }}>Handle taken</span>
              </>
            ) : avail === "error" ? (
              <span style={{ color: "var(--color-danger)" }}>{availError || "Could not verify handle"}</span>
            ) : null}
          </div>
        ) : null}
        {saveError ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-danger)", marginBottom: 12 }}>
            {saveError}
          </div>
        ) : null}
        <button
          type="button"
          className="btn-teal"
          style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: canConfirm ? 1 : 0.5 }}
          disabled={!canConfirm}
          onClick={() => void onConfirm()}
        >
          {confirmBusy ? "…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
