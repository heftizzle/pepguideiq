/** Map saved stack frequency string to builder row frequency fields. */
export function parseFreqFromStack(stackFrequency) {
  const s = String(stackFrequency || "").trim().toLowerCase();
  if (!s) return { freqKey: "daily", customPerWeek: "" };
  const cm = s.match(/^(\d+(?:\.\d+)?)\s*x\/?\s*week/i);
  if (cm) return { freqKey: "custom", customPerWeek: cm[1] };
  if (/eod|every other/.test(s)) return { freqKey: "eod", customPerWeek: "" };
  if (/3\s*x|three times/.test(s)) return { freqKey: "3x", customPerWeek: "" };
  if (/2\s*x|twice/.test(s)) return { freqKey: "2x", customPerWeek: "" };
  if (/weekly|once a week/.test(s)) return { freqKey: "weekly", customPerWeek: "" };
  if (/daily|every day|qd\b/.test(s)) return { freqKey: "daily", customPerWeek: "" };
  return { freqKey: "daily", customPerWeek: "" };
}

/** Build Build-tab row list from saved stack items (`myStack`). */
export function buildRowsFromMyStack(myStack) {
  const list = Array.isArray(myStack) ? myStack : [];
  return list.map((item) => {
    const freq = parseFreqFromStack(item.stackFrequency);
    return {
      key:
        item.stackRowKey ??
        (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random())),
      peptideId: item.id,
      dose: item.stackDose ?? item.startDose ?? "",
      freqKey: freq.freqKey,
      customPerWeek: freq.customPerWeek,
      addedDate: item.addedDate,
    };
  });
}
