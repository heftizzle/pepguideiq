import { useCallback, useEffect, useMemo, useState } from "react";
import { TIER_RANK } from "../lib/tiers.js";
import { formatInbodyScanDateLabel, formatInbodyScanDateOnly, inbodyToNum, INBODY_EM } from "../lib/inbodyScanDisplay.js";
import { fetchAllInbodyScanHistory } from "../lib/supabase.js";
import { InBodyScanCard } from "./InBodyScanCard.jsx";
import { InBodyScanSection } from "./InBodyScanSection.jsx";
import { InbodyScoreRing } from "./InbodyScoreRing.jsx";
import { Modal } from "./Modal.jsx";
import { BodyScanShareComposer } from "./BodyScanShareComposer.jsx";
import { BodyScanTrendsView } from "./BodyScanTrendsView.jsx";

const EM = INBODY_EM;

/**
 * @param {number | null} cur
 * @param {number | null} prev
 * @param {{ lowerIsGood?: boolean, higherIsGood?: boolean, digits?: number }} opts
 */
function formatDelta(cur, prev, opts) {
  const { lowerIsGood = false, higherIsGood = false, digits = 1 } = opts;
  if (prev == null || cur == null) return { text: EM, tone: "muted", arrow: null };
  const d = cur - prev;
  if (!Number.isFinite(d)) return { text: EM, tone: "muted", arrow: null };
  const abs = Math.abs(d);
  const txt = `${d > 0 ? "+" : d < 0 ? "-" : ""}${abs.toFixed(digits)}`;
  let tone = "muted";
  let arrow = d > 0 ? "↑" : d < 0 ? "↓" : null;
  if (d === 0) tone = "muted";
  else if (lowerIsGood && d < 0) tone = "good";
  else if (lowerIsGood && d > 0) tone = "bad";
  else if (higherIsGood && d > 0) tone = "good";
  else if (higherIsGood && d < 0) tone = "bad";
  else if (!lowerIsGood && !higherIsGood) tone = "muted";
  return { text: txt, tone, arrow };
}

/**
 * @param {{ label: string, cur: number | null, prev: number | null, baseline: boolean, lowerIsGood?: boolean, higherIsGood?: boolean, suffix?: string }} p
 */
function StatDelta({ label, cur, prev, baseline, lowerIsGood, higherIsGood, suffix = "" }) {
  const d = baseline || prev == null || cur == null ? null : formatDelta(cur, prev, { lowerIsGood, higherIsGood });
  const color =
    d?.tone === "good"
      ? "var(--color-text-success)"
      : d?.tone === "bad"
        ? "var(--color-text-danger)"
        : "var(--color-text-muted)";
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "var(--color-text-muted)", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-text-primary)" }}>
        {cur == null ? EM : `${cur.toFixed(1)}${suffix}`}
      </div>
      {baseline || prev == null || cur == null ? (
        <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>baseline</div>
      ) : (
        <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
          {d?.arrow} {d?.text}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   profileId: string,
 *   userId: string,
 *   tier: string,
 *   handle: string,
 *   onBack: () => void,
 *   onOpenUpgrade: () => void,
 *   onErrorMessage?: (msg: string) => void,
 *   onSavedBriefly?: () => void,
 *   workerOk: boolean,
 *   activeStack?: { id: string, name: string, stackDose?: string, stackFrequency?: string }[],
 *   onGuideDeepAnalysis?: (prompt: string) => void,
 *   onInterpretationPersisted?: () => void | Promise<void>,
 * }} props
 */
export function BodyScanView({
  profileId,
  userId,
  tier,
  handle,
  onBack,
  onOpenUpgrade,
  onErrorMessage,
  onSavedBriefly,
  workerOk,
  activeStack = [],
  onGuideDeepAnalysis,
  onInterpretationPersisted,
}) {
  const planKey = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  const isProPlus = (TIER_RANK[planKey] ?? 0) >= TIER_RANK.pro;

  const [rows, setRows] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [loadErr, setLoadErr] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [detailScan, setDetailScan] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [sharePair, setSharePair] = useState(/** @type {{ current: Record<string, unknown>, previous: Record<string, unknown> } | null} */ (null));
  const [bodyTab, setBodyTab] = useState(/** @type {"scans" | "trends"} */ ("scans"));

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const { rows: r, error } = await fetchAllInbodyScanHistory(profileId);
    if (error) setLoadErr(error.message || "Could not load scans.");
    else setRows(r);
    setLoading(false);
  }, [profileId]);

  const persistInterpretation = onInterpretationPersisted ?? reload;

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (bodyTab === "trends" && rows.length < 2) setBodyTab("scans");
  }, [bodyTab, rows.length]);

  const countLabel = useMemo(() => {
    const n = rows.length;
    return `${n} scan${n === 1 ? "" : "s"}`;
  }, [rows.length]);

  const onUploadClick = useCallback(() => {
    if (!isProPlus) {
      onOpenUpgrade();
      return;
    }
    setShowUpload(true);
  }, [isProPlus, onOpenUpgrade]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: "'Outfit', sans-serif" }} className="pepv-profile-tab">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            border: "1px solid var(--color-border-emphasis)",
            background: "var(--color-bg-card)",
            color: "var(--color-text-primary)",
            borderRadius: 8,
            width: 40,
            height: 40,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>Body Scan</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{countLabel}</div>
        </div>
        <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "8px 14px", marginLeft: "auto" }} onClick={onUploadClick}>
          Upload scan
        </button>
      </div>

      {!loading && rows.length > 0 ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setBodyTab("scans")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: bodyTab === "scans" ? "2px solid var(--color-accent)" : "1px solid var(--color-border-default)",
              background: bodyTab === "scans" ? "var(--color-bg-elevated)" : "var(--color-bg-card)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Scans
          </button>
          <button
            type="button"
            title={rows.length < 2 ? "Upload a second scan to unlock trends." : undefined}
            disabled={rows.length < 2}
            onClick={() => rows.length >= 2 && setBodyTab("trends")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: bodyTab === "trends" ? "2px solid var(--color-accent)" : "1px solid var(--color-border-default)",
              background: bodyTab === "trends" ? "var(--color-bg-elevated)" : "var(--color-bg-card)",
              color: rows.length < 2 ? "var(--color-text-muted)" : "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: rows.length < 2 ? "not-allowed" : "pointer",
              opacity: rows.length < 2 ? 0.55 : 1,
            }}
          >
            Trends
          </button>
        </div>
      ) : null}

      {loadErr ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginBottom: 12 }}>
          {loadErr}
        </div>
      ) : null}

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "24px 0", textAlign: "center" }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--color-border-default)",
            borderRadius: 12,
            padding: "40px 20px",
            textAlign: "center",
            background: "var(--color-bg-elevated)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Upload your first InBody scan</div>
          <button type="button" className="btn-teal" onClick={onUploadClick}>
            Upload scan
          </button>
        </div>
      ) : bodyTab === "trends" ? (
        <BodyScanTrendsView
          key={profileId}
          scans={rows}
          profileId={profileId}
          userId={userId}
          tier={planKey}
          activeStack={activeStack}
          workerOk={workerOk}
          onOpenUpgrade={onOpenUpgrade}
          onGuideDeepAnalysis={onGuideDeepAnalysis}
          onInterpretationPersisted={persistInterpretation}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((row, idx) => {
            const scanDateRaw = row.scan_date ?? null;
            const dateShown = formatInbodyScanDateOnly(scanDateRaw, "medium") ?? formatInbodyScanDateLabel(scanDateRaw) ?? EM;
            const w = inbodyToNum(row.weight_lbs ?? null);
            const smm = inbodyToNum(row.smm_lbs ?? null);
            const pbf = inbodyToNum(row.pbf_pct ?? null);
            const score = inbodyToNum(row.inbody_score ?? null);
            const older = rows[idx + 1];
            const ow = older ? inbodyToNum(older.weight_lbs ?? null) : null;
            const osmm = older ? inbodyToNum(older.smm_lbs ?? null) : null;
            const opbf = older ? inbodyToNum(older.pbf_pct ?? null) : null;
            const baseline = !older;

            const canShare = Boolean(older);

            return (
              <div
                key={typeof row.id === "string" ? row.id : String(idx)}
                style={{
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 10,
                  padding: 14,
                  background: "var(--color-bg-card)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{dateShown}</span>
                      {idx === 0 ? (
                        <span
                          className="mono"
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.08em",
                            color: "var(--color-accent)",
                            border: "1px solid var(--color-accent-nav-border)",
                            borderRadius: 4,
                            padding: "2px 6px",
                          }}
                        >
                          LATEST
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <InbodyScoreRing size={36} score={score} />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <StatDelta label="Weight" cur={w} prev={ow} baseline={baseline} lowerIsGood suffix=" lb" />
                  <StatDelta label="SMM" cur={smm} prev={osmm} baseline={baseline} higherIsGood suffix=" lb" />
                  <StatDelta label="BF%" cur={pbf} prev={opbf} baseline={baseline} lowerIsGood suffix="%" />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setDetailScan(row)}>
                    View full scan
                  </button>
                  <button
                    type="button"
                    className="btn-teal"
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      opacity: canShare ? 1 : 0.45,
                      cursor: canShare ? "pointer" : "not-allowed",
                    }}
                    disabled={!canShare}
                    onClick={() => {
                      if (!canShare || !older) return;
                      setSharePair({ current: row, previous: older });
                    }}
                  >
                    Share progress
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && isProPlus ? (
        <Modal onClose={() => setShowUpload(false)} label="Upload body scan" maxWidth={620}>
          <InBodyScanSection
            userId={userId}
            profileId={profileId}
            canUploadBodyScan={isProPlus}
            workerOk={workerOk}
            onOpenUpgrade={onOpenUpgrade}
            onErrorMessage={(m) => onErrorMessage?.(typeof m === "string" ? m : "Upload failed.")}
            onSavedBriefly={() => {
              onSavedBriefly?.();
              setShowUpload(false);
              void reload();
            }}
          />
        </Modal>
      ) : null}

      {detailScan ? (
        <Modal onClose={() => setDetailScan(null)} label="InBody scan" maxWidth={720}>
          <InBodyScanCard
            scan={detailScan}
            handle={handle}
            prevScan={(() => {
              const i = rows.findIndex((r) => String(r.id ?? "") === String(detailScan.id ?? ""));
              return i >= 0 && i < rows.length - 1 ? rows[i + 1] : null;
            })()}
          />
        </Modal>
      ) : null}

      {sharePair ? (
        <BodyScanShareComposer
          onClose={() => setSharePair(null)}
          currentScan={sharePair.current}
          previousScan={sharePair.previous}
          activeStack={activeStack}
          handle={handle}
          userId={userId}
          profileId={profileId}
          tier={planKey}
          onPosted={() => {
            onSavedBriefly?.();
            setSharePair(null);
          }}
          onErrorMessage={onErrorMessage}
          onOpenUpgrade={onOpenUpgrade}
        />
      ) : null}
    </div>
  );
}
