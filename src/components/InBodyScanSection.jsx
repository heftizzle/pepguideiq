import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { getSessionAccessToken } from "../lib/supabase.js";
import {
  buildInbodyScanHistoryInsertRow,
  buildRawJsonPayload,
  hasAcceptedInbodyScanWaiver,
  INBODY_SCAN_FIELD_DEFS,
  setInbodyScanWaiverAccepted,
} from "../lib/inbodyScanFields.js";
import {
  R2_UPLOAD_ACCEPT_ATTR,
  R2_UPLOAD_MAX_BYTES,
  uploadImageToR2,
  validateUploadFile,
} from "../lib/r2Upload.js";
import { insertInbodyScanHistory, fetchLatestInbodyScanHistory } from "../lib/supabase.js";
import { Modal } from "./Modal.jsx";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** @param {unknown} v */
function valueToInputString(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

/** @param {unknown} c */
function confidenceLabel(c) {
  const s = typeof c === "string" ? c.trim().toLowerCase() : "";
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  return "—";
}

/**
 * Pro+ InBody-style scan: vision extract → review → R2 `userId/scans/{iso}.jpg` + `inbody_scan_history` row.
 */
export function InBodyScanSection({
  userId,
  profileId,
  canUploadBodyScan,
  workerOk,
  onOpenUpgrade,
  onErrorMessage,
  onSavedBriefly,
}) {
  const fileInputRef = useRef(null);
  const pendingFileRef = useRef(/** @type {File | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [fileForCommit, setFileForCommit] = useState(/** @type {File | null} */ (null));
  const [fieldStrings, setFieldStrings] = useState(() => /** @type {Record<string, string>} */ ({}));
  const [confidence, setConfidence] = useState(() => /** @type {Record<string, unknown>} */ ({}));
  const [extractRawText, setExtractRawText] = useState(/** @type {string | null} */ (null));

  const resetReviewState = useCallback(() => {
    setShowReview(false);
    setFileForCommit(null);
    setFieldStrings({});
    setConfidence({});
    setExtractRawText(null);
  }, []);

  const runExtract = useCallback(
    async (file) => {
      if (!userId || !profileId || !isApiWorkerConfigured()) {
        onErrorMessage?.("Configure VITE_API_WORKER_URL to use scan extraction.");
        return;
      }
      const weekCheck = await fetchLatestInbodyScanHistory(profileId);
      if (weekCheck.error) {
        onErrorMessage?.(weekCheck.error.message || "Could not verify scan cadence.");
        return;
      }
      const lastIso = weekCheck.row && typeof weekCheck.row.created_at === "string" ? weekCheck.row.created_at : "";
      if (lastIso) {
        const t = Date.parse(lastIso);
        if (Number.isFinite(t) && Date.now() - t < ONE_WEEK_MS) {
          onErrorMessage?.("You can save one composition scan per week. Try again after your last scan is a week old.");
          return;
        }
      }

      const token = await getSessionAccessToken();
      if (!token) {
        onErrorMessage?.("Session expired — sign in again.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      const url = `${API_WORKER_URL}/inbody-scan/extract`;
      setBusy(true);
      onErrorMessage?.("");
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          onErrorMessage?.(typeof j.error === "string" ? j.error : "Scan extraction failed.");
          return;
        }
        const values = j.values && typeof j.values === "object" ? j.values : {};
        const conf = j.confidence && typeof j.confidence === "object" ? j.confidence : {};
        const nextStrings = {};
        for (const def of INBODY_SCAN_FIELD_DEFS) {
          nextStrings[def.key] = valueToInputString(values[def.key]);
        }
        setFieldStrings(nextStrings);
        setConfidence(conf);
        setExtractRawText(typeof j.rawText === "string" ? j.rawText : null);
        setFileForCommit(file);
        setShowReview(true);
      } catch {
        onErrorMessage?.("Network error during extraction.");
      } finally {
        setBusy(false);
      }
    },
    [userId, profileId, onErrorMessage]
  );

  const onPickFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!canUploadBodyScan) {
        onOpenUpgrade?.();
        return;
      }
      if (!workerOk) {
        onErrorMessage?.("Configure VITE_API_WORKER_URL to upload.");
        return;
      }
      if (!profileId) {
        onErrorMessage?.("No active profile");
        return;
      }
      const ve = validateUploadFile(file);
      if (ve) {
        onErrorMessage?.(ve);
        return;
      }
      if (file.size > R2_UPLOAD_MAX_BYTES) {
        onErrorMessage?.("Max 10MB");
        return;
      }
      if (!hasAcceptedInbodyScanWaiver()) {
        pendingFileRef.current = file;
        setShowWaiver(true);
        return;
      }
      void runExtract(file);
    },
    [canUploadBodyScan, workerOk, profileId, onOpenUpgrade, onErrorMessage, runExtract]
  );

  const acceptWaiverAndContinue = useCallback(() => {
    setInbodyScanWaiverAccepted();
    const f = pendingFileRef.current;
    pendingFileRef.current = null;
    setShowWaiver(false);
    if (f) void runExtract(f);
  }, [runExtract]);

  const dismissWaiver = useCallback(() => {
    pendingFileRef.current = null;
    setShowWaiver(false);
  }, []);

  const onFieldChange = useCallback((key, s) => {
    setFieldStrings((prev) => ({ ...prev, [key]: s }));
  }, []);

  const onAcceptCommit = useCallback(async () => {
    if (!fileForCommit || !userId || !profileId) return;
    setBusy(true);
    onErrorMessage?.("");
    try {
      const up = await uploadImageToR2({
        path: "/stack-photo",
        file: fileForCommit,
        fields: { kind: "inbody_scan_history", member_profile_id: profileId },
      });
      if (!up.ok) {
        onErrorMessage?.(up.error);
        setBusy(false);
        return;
      }
      const rawJsonStored = buildRawJsonPayload(
        Object.fromEntries(INBODY_SCAN_FIELD_DEFS.map((d) => [d.key, fieldStrings[d.key] ?? ""])),
        confidence,
        { rawText: extractRawText }
      );
      const insertRow = buildInbodyScanHistoryInsertRow(fieldStrings, up.key, userId, profileId, {
        ...rawJsonStored,
        r2WorkerUrlNote: "private read via GET /stack-photo?key=",
      });
      const { error } = await insertInbodyScanHistory(insertRow);
      if (error) {
        console.error("[InBodyScanSection] insert failed", error);
        onErrorMessage?.(error.message || "Could not save scan record.");
        setBusy(false);
        return;
      }
      resetReviewState();
      onSavedBriefly?.();
    } catch (err) {
      console.error("[InBodyScanSection] commit failed", err);
      onErrorMessage?.("Save failed — try again.");
    } finally {
      setBusy(false);
    }
  }, [
    fileForCommit,
    userId,
    profileId,
    fieldStrings,
    confidence,
    extractRawText,
    onErrorMessage,
    onSavedBriefly,
    resetReviewState,
  ]);

  return (
    <>
      <input ref={fileInputRef} type="file" accept={R2_UPLOAD_ACCEPT_ATTR} hidden onChange={onPickFile} />
      <button
        type="button"
        className="btn-teal"
        style={{ fontSize: 13, opacity: busy ? 0.75 : 1 }}
        disabled={busy || !profileId}
        onClick={() => {
          if (!canUploadBodyScan) {
            onOpenUpgrade?.();
            return;
          }
          fileInputRef.current?.click();
        }}
      >
        {busy ? "Working…" : "Upload scan (InBody / DEXA)"}
      </button>
      {showWaiver &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal onClose={dismissWaiver} maxWidth={520} label="Body composition scan waiver">
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.55 }}>
              <p style={{ marginBottom: 12 }}>
                Automated reading of your scan image uses a third-party vision model. Results may be incomplete or
                inaccurate—always compare to your printed report and edit before saving.
              </p>
              <p style={{ marginBottom: 16, color: "var(--color-text-secondary)", fontSize: 13 }}>
                By continuing you agree not to rely on extracted numbers for medical decisions and to use this feature
                only for personal tracking. One saved scan per member profile per rolling week.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-teal" onClick={dismissWaiver}>
                  Cancel
                </button>
                <button type="button" className="btn-teal" onClick={acceptWaiverAndContinue}>
                  I understand — continue
                </button>
              </div>
            </div>
          </Modal>,
          document.body
        )}
      {showReview && typeof document !== "undefined"
        ? createPortal(
            <Modal
              onClose={() => {
                if (!busy) resetReviewState();
              }}
              maxWidth={640}
              label="Review InBody scan extraction"
            >
              <div style={{ fontFamily: "'Outfit', sans-serif", color: "var(--color-text-primary)" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.45 }}>
                  Edit any value before saving. Empty fields store as null. Scan date should be the report date/time (ISO).
                </div>
                <div style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {INBODY_SCAN_FIELD_DEFS.map((def) => {
                    const conf = confidenceLabel(confidence[def.key]);
                    const confColor =
                      conf === "High"
                        ? "var(--color-accent)"
                        : conf === "Medium"
                          ? "var(--color-warning)"
                          : "var(--color-text-muted)";
                    return (
                      <div
                        key={def.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 72px",
                          gap: 8,
                          alignItems: "center",
                          borderBottom: "1px solid var(--color-border-hairline)",
                          paddingBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{def.label}</div>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 13, width: "100%" }}
                            value={fieldStrings[def.key] ?? ""}
                            onChange={(e) => onFieldChange(def.key, e.target.value)}
                            disabled={busy}
                            autoComplete="off"
                          />
                        </div>
                        <div className="mono" style={{ fontSize: 10, color: confColor, textAlign: "right", letterSpacing: "0.06em" }}>
                          {conf}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                  <button type="button" className="btn-teal" disabled={busy} onClick={() => !busy && resetReviewState()}>
                    Cancel
                  </button>
                  <button type="button" className="btn-teal" disabled={busy} onClick={() => void onAcceptCommit()}>
                    {busy ? "Saving…" : "Accept & save"}
                  </button>
                </div>
              </div>
            </Modal>,
            document.body
          )
        : null}
    </>
  );
}

