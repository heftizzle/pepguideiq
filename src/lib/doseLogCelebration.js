/**
 * Copy for post–dose log celebration (Protocol / stack quick log).
 * @param {{ id?: unknown; components?: { name?: string; mg?: number }[] } | null | undefined} catalogRow
 * @param {string} displayName — stack / protocol row label
 */
export function getDoseLogCelebrationMessage(catalogRow, displayName) {
  const name = (displayName && String(displayName).trim()) || "Compound";
  const components = Array.isArray(catalogRow?.components) ? catalogRow.components : [];
  const partNames = components
    .map((c) => (typeof c?.name === "string" ? c.name.trim() : ""))
    .filter(Boolean);

  if (partNames.length > 0) {
    return `✓ ${name} logged — ${partNames.join(" · ")} working.`;
  }

  const templates = [
    (n) => `✓ ${n} logged. Consistency is the protocol.`,
    (n) => `🧬 ${n} logged. Stack receipted.`,
    (n) => `⚡ ${n} logged. Let it work.`,
    (n) => `🐐 ${n} logged. GOAT behavior.`,
    (n) => `🔬 ${n} logged. Data is the protocol.`,
  ];
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return pick(name);
}
