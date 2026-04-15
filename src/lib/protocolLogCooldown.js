import { protocolLogCooldownEndsAtMs } from "./localCalendarDay.js";

/**
 * Per-peptide unlock timestamps (ms) for interim 2h-or-midnight log lock.
 * @param {Record<string, string>} latestByPeptide `peptide_id` → latest `dosed_at` ISO on the local day
 * @returns {Record<string, number>} peptide_id → unlock at (epoch ms); only entries still in the future
 */
export function lockMapFromLatestDosedAtIso(latestByPeptide) {
  const now = Date.now();
  /** @type {Record<string, number>} */
  const out = {};
  for (const [pid, iso] of Object.entries(latestByPeptide ?? {})) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) continue;
    const end = protocolLogCooldownEndsAtMs(t);
    if (end > now) out[pid] = end;
  }
  return out;
}
