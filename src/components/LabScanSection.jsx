import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import {
  deleteLabResultsForReport,
  fetchLabProviders,
  getSessionAccessToken,
  insertLabResults,
  upsertLabReport,
} from "../lib/supabase.js";
import { getMarkerDef } from "../data/labMarkerRegistry.js";
import {
  LAB_REPORT_ACCEPT_ATTR,
  LAB_REPORT_UPLOAD_ALLOWED_TYPES,
  R2_UPLOAD_MAX_BYTES,
  uploadLabReportToR2,
  validateLabReportUploadFile,
} from "../lib/r2Upload.js";
import {
  hasAcceptedLabReportWaiver,
  setLabReportWaiverAccepted,
} from "../lib/labReportWaiver.js";
import { Modal } from "./Modal.jsx";

/** @param {File | null | undefined} file */
function reportTypeFromFile(file) {
  const t = file?.type?.trim().toLowerCase() ?? "";
  return t === "application/pdf" ? "pdf_parsed" : "structured_manual";
}

/**
 * Pro+ lab upload — extraction → review → R2 + upsert lab_reports / lab_results.
 */
export function LabScanSection({
  userId,
  profileId,
  canUploadBodyScan,
  workerOk,
  onOpenUpgrade,
  onErrorMessage,
  onSavedBriefly,
  activeStack = [],
  protocolEvents = [],
}) {
  const fileInputRef = useRef(null);
  const pendingFileRef = useRef(/** @type {File | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [fileForCommit, setFileForCommit] = useState(/** @type {File | null} */ (null));
  /** @type {[Record<string, unknown>[], import('react').Dispatch<import('react').SetStateAction<Record<string, unknown>[]>>]} */
  const [markers, setMarkers] = useState([]);
  const [extractRawText, setExtractRawText] = useState(/** @type {string | null} */ (null));
  const [extractProviderLabel, setExtractProviderLabel] = useState(/** @type {string | null} */ (null));
  const [dateDrawn, setDateDrawn] = useState("");
  const [dateDrawnError, setDateDrawnError] = useState(false);
  const [labProviders, setLabProviders] = useState(/** @type {{ id: string, name: string }[]} */ ([]));
  const [labProviderId, setLabProviderId] = useState("");
  const providerSeedRef = useRef(false);

  const resetReviewState = useCallback(() => {
    setShowReview(false);
    setFileForCommit(null);
    setMarkers([]);
    setExtractRawText(null);
    setExtractProviderLabel(null);
    setDateDrawn("");
    setDateDrawnError(false);
    setLabProviderId("");
  }, []);

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) return;
    let cancelled = false;
    void fetchLabProviders().then(({ rows }) => {
      if (!cancelled && Array.isArray(rows)) setLabProviders(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    if (!showReview) providerSeedRef.current = false;
  }, [showReview]);

  useEffect(() => {
    if (!showReview || providerSeedRef.current || !extractProviderLabel || labProviders.length === 0) return;
    const el = extractProviderLabel.trim().toLowerCase();
    const hit = labProviders.find((p) => p.name.trim().toLowerCase() === el);
    if (hit) {
      setLabProviderId(hit.id);
      providerSeedRef.current = true;
    }
  }, [showReview, extractProviderLabel, labProviders]);

  const runExtract = useCallback(
    async (file) => {
      if (!userId || !profileId || !isApiWorkerConfigured()) {
        onErrorMessage?.("Configure VITE_API_WORKER_URL to use lab extraction.");
        return;
      }
      const token = await getSessionAccessToken();
      if (!token) {
        onErrorMessage?.("Session expired — sign in again.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      setBusy(true);
      onErrorMessage?.("");
      try {
        const res = await fetch(`${API_WORKER_URL}/lab-report/extract`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          onErrorMessage?.(typeof j.error === "string" ? j.error : "Lab extraction failed.");
          return;
        }
        const mks = Array.isArray(j.markers) ? j.markers : [];
        setMarkers(mks.map((x) => (x && typeof x === "object" ? x : {})));
        setExtractRawText(typeof j.rawText === "string" ? j.rawText : null);
        const pv =
          j.provider != null && String(j.provider).trim()
            ? String(j.provider).trim()
            : null;
        setExtractProviderLabel(pv);
        let dd =
          typeof j.date_drawn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j.date_drawn.trim())
            ? j.date_drawn.trim().slice(0, 10)
            : "";
        setDateDrawn(dd);
        setDateDrawnError(false);
        setLabProviderId("");
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
      const ve = validateLabReportUploadFile(file);
      if (ve) {
        onErrorMessage?.(ve);
        return;
      }
      if (file.size > R2_UPLOAD_MAX_BYTES) {
        onErrorMessage?.("Max 10MB");
        return;
      }
      const mimeOk =
        typeof file.type === "string" &&
        LAB_REPORT_UPLOAD_ALLOWED_TYPES.has(file.type.trim().toLowerCase());
      if (!mimeOk) {
        onErrorMessage?.("Unsupported file type.");
        return;
      }
      if (!hasAcceptedLabReportWaiver()) {
        pendingFileRef.current = file;
        setShowWaiver(true);
        return;
      }
      void runExtract(file);
    },
    [canUploadBodyScan, workerOk, profileId, onOpenUpgrade, onErrorMessage, runExtract]
  );

  const acceptWaiverAndContinue = useCallback(() => {
    setLabReportWaiverAccepted();
    const f = pendingFileRef.current;
    pendingFileRef.current = null;
    setShowWaiver(false);
    if (f) void runExtract(f);
  }, [runExtract]);

  const dismissWaiver = useCallback(() => {
    pendingFileRef.current = null;
    setShowWaiver(false);
  }, []);

  const onAcceptCommit = useCallback(async () => {
    if (!fileForCommit || !userId || !profileId) return;
    const dd = String(dateDrawn ?? "").trim();
    if (!dd || !/^\d{4}-\d{2}-\d{2}$/.test(dd)) {
      setDateDrawnError(true);
      onErrorMessage?.("Set specimen draw date to save — required for merging uploads.");
      return;
    }
    setDateDrawnError(false);
    setBusy(true);
    onErrorMessage?.("");
    try {
      const up = await uploadLabReportToR2({
        file: fileForCommit,
        memberProfileId: profileId,
      });
      if (!up.ok) {
        onErrorMessage?.(up.error);
        return;
      }
      const rt = reportTypeFromFile(fileForCommit);
      const lp =
        typeof labProviderId === "string" && /^[0-9a-f-]{36}$/i.test(labProviderId.trim())
          ? labProviderId.trim()
          : null;
      const metaBase = {
        extractor: "worker_lab_extract_v1",
      };
      const upsertRow = {
        user_id: userId,
        profile_id: profileId,
        r2_key: up.key,
        date_drawn: dd,
        lab_provider_id: lp,
        report_type: rt,
        raw_text: extractRawText,
        metadata: metaBase,
      };
      const { id: reportId, error: upErr } = await upsertLabReport(upsertRow);
      if (upErr || !reportId) {
        console.error("[LabScanSection] upsert failed", upErr);
        onErrorMessage?.(upErr?.message ?? "Could not save lab report.");
        return;
      }
      const { error: delErr } = await deleteLabResultsForReport(reportId);
      if (delErr) {
        console.error("[LabScanSection] delete prior results failed", delErr);
        onErrorMessage?.(delErr.message ?? "Could not refresh markers.");
        return;
      }
      const rows = markers
        .filter((m) => m && typeof m === "object" && typeof m.canonical_key === "string" && m.canonical_key.trim())
        .map((m) => ({
          report_id: reportId,
          user_id: userId,
          profile_id: profileId,
          canonical_key: String(m.canonical_key).trim(),
          raw_name: typeof m.raw_name === "string" ? m.raw_name : null,
          value_numeric: typeof m.value_numeric === "number" && Number.isFinite(m.value_numeric) ? m.value_numeric : null,
          value_text: typeof m.value_text === "string" && m.value_text.trim() ? m.value_text.trim() : null,
          unit: typeof m.unit === "string" && m.unit.trim() ? m.unit.trim() : null,
          ref_low: typeof m.ref_low === "number" && Number.isFinite(m.ref_low) ? m.ref_low : null,
          ref_high: typeof m.ref_high === "number" && Number.isFinite(m.ref_high) ? m.ref_high : null,
          in_range: typeof m.in_range === "boolean" ? m.in_range : null,
          flag: typeof m.flag === "string" && m.flag.trim() ? m.flag.trim() : null,
          date_drawn: dd,
        }));
      if (rows.length > 0) {
        const { error: insErr } = await insertLabResults(rows);
        if (insErr) {
          console.error("[LabScanSection] insert results failed", insErr);
          onErrorMessage?.(insErr.message ?? "Could not save marker rows.");
          return;
        }
      }
      resetReviewState();
      onSavedBriefly?.();

      const markersPayload = markers.filter((m) => m?.canonical_key);
      const token = await getSessionAccessToken();
      const interpretBody = JSON.stringify({
        reportId,
        markers: markersPayload.slice(0, 120),
        protocolEvents,
        activeStack: (activeStack ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          dose:
            [r.stackDose, r.stackFrequency]
              .filter((x) => typeof x === "string" && x.trim())
              .join(" · ")
              .trim() || null,
        })),
      });
      if (token && isApiWorkerConfigured()) {
        void fetch(`${API_WORKER_URL}/lab-report/interpret`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: interpretBody,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("[LabScanSection] commit failed", err);
      onErrorMessage?.("Save failed — try again.");
    } finally {
      setBusy(false);
    }
  }, [
    fileForCommit,
    userId,
    profileId,
    dateDrawn,
    markers,
    extractRawText,
    labProviderId,
    protocolEvents,
    activeStack,
    onErrorMessage,
    onSavedBriefly,
    resetReviewState,
  ]);

  return (
    <>
      <input ref={fileInputRef} type="file" accept={LAB_REPORT_ACCEPT_ATTR} hidden onChange={onPickFile} />
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
        {busy ? "Working…" : "Upload lab report (PDF / photo)"}
      </button>

      {showWaiver &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal onClose={dismissWaiver} maxWidth={520} label="Lab report waiver">
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.55 }}>
              <p style={{ marginBottom: 12 }}>
                Automated extraction reads your lab file using a third-party AI model. Results may be incomplete or wrong —
                always compare to your official lab portal or PDF before trusting trends here.
              </p>
              <p style={{ marginBottom: 16, color: "var(--color-text-secondary)", fontSize: 13 }}>
                Lab values shown in PepGuideIQ are for <strong>personal tracking only</strong>. They are not medical advice,
                diagnosis, or treatment guidance — consult a licensed clinician for medical decisions.
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
              maxWidth={680}
              label="Review lab extraction"
            >
              <div style={{ fontFamily: "'Outfit', sans-serif", color: "var(--color-text-primary)" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 12, lineHeight: 1.45 }}>
                  Confirm specimen draw date (required — duplicates merge silently). Override lab vendor if needed.
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>Detected vendor</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        color: "var(--color-accent)",
                        border: "1px solid var(--color-accent-nav-border)",
                        borderRadius: 4,
                        padding: "4px 8px",
                      }}
                    >
                      {extractProviderLabel ?? "—"}
                    </span>
                    <select
                      className="form-input"
                      style={{ fontSize: 13, flex: "1 1 160px", minWidth: 0 }}
                      value={labProviderId}
                      onChange={(e) => {
                        providerSeedRef.current = true;
                        setLabProviderId(e.target.value);
                      }}
                      disabled={busy}
                      aria-label="Lab vendor override"
                    >
                      <option value="">Match detected vendor</option>
                      {labProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="lab-draw-date" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                    Specimen draw date <span style={{ color: "var(--color-text-danger)" }}>*</span>
                  </label>
                  <input
                    id="lab-draw-date"
                    type="date"
                    className="form-input"
                    style={{ fontSize: 13, width: "100%", maxWidth: 280 }}
                    value={dateDrawn}
                    onChange={(e) => {
                      setDateDrawn(e.target.value);
                      setDateDrawnError(false);
                    }}
                    disabled={busy}
                    required
                  />
                  {dateDrawnError ? (
                    <div className="mono" style={{ fontSize: 11, color: "var(--color-text-danger)", marginTop: 6 }}>
                      Draw date is required — used as the merge key with report type so duplicate uploads replace cleanly.
                    </div>
                  ) : null}
                </div>

                <div style={{ maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {markers.length === 0 ? (
                    <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      No markers extracted — try a clearer scan or PDF text export.
                    </div>
                  ) : (
                    markers.map((m, idx) => {
                      const ck = typeof m.canonical_key === "string" ? m.canonical_key.trim() : "";
                      const def = ck ? getMarkerDef(ck) : null;
                      const disp =
                        (def?.display_name && String(def.display_name).trim()) ||
                        ck ||
                        (typeof m.raw_name === "string" ? m.raw_name : "—");
                      const val =
                        typeof m.value_numeric === "number" && Number.isFinite(m.value_numeric)
                          ? String(m.value_numeric)
                          : typeof m.value_text === "string" && m.value_text.trim()
                            ? m.value_text.trim()
                            : "—";
                      const unit = typeof m.unit === "string" && m.unit.trim() ? m.unit.trim() : "";
                      const dot =
                        m.in_range === true
                          ? "var(--color-text-success)"
                          : m.in_range === false
                            ? "var(--color-text-danger)"
                            : "var(--color-text-muted)";
                      const rk = ck || `row-${idx}`;
                      return (
                        <div
                          key={rk}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0,1fr) 72px 56px 12px",
                            gap: 8,
                            alignItems: "center",
                            borderBottom: "1px solid var(--color-border-hairline)",
                            paddingBottom: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div className="mono" style={{ fontSize: 10, color: "var(--color-text-muted)", marginBottom: 4 }}>
                              {ck || "(unmatched)"}
                            </div>
                            <div style={{ fontSize: 13 }}>{disp}</div>
                          </div>
                          <div className="mono" style={{ fontSize: 12, textAlign: "right", wordBreak: "break-word" }}>
                            {val}
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "right" }}>
                            {unit || "—"}
                          </div>
                          <div
                            title={m.in_range === true ? "In range" : m.in_range === false ? "Out of range" : "Unknown"}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              background: dot,
                              justifySelf: "end",
                            }}
                          />
                        </div>
                      );
                    })
                  )}
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
