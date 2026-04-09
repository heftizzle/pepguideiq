/** Local calendar day key YYYY-MM-DD from an ISO timestamp or Date (browser local timezone). */
export function localDayKeyFromInstant(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysToYmd(ymd, delta) {
  const [y, m, day] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, day + delta);
  return localDayKeyFromInstant(dt);
}

/**
 * Streak = consecutive local calendar days with ≥1 dose, ending today or yesterday
 * (so logging late at night / timezone edges don't zero the streak).
 * @param {string[]} dosedAtIsos — `dosed_at` values from dose_logs
 */
export function calculateStreak(dosedAtIsos) {
  if (!dosedAtIsos?.length) return 0;
  const daySet = new Set();
  for (const iso of dosedAtIsos) {
    const k = localDayKeyFromInstant(iso);
    if (k) daySet.add(k);
  }
  if (daySet.size === 0) return 0;
  const todayKey = localDayKeyFromInstant(new Date());
  if (!todayKey) return 0;
  const yesterdayKey = addDaysToYmd(todayKey, -1);
  let anchor = todayKey;
  if (!daySet.has(todayKey)) {
    if (!daySet.has(yesterdayKey)) return 0;
    anchor = yesterdayKey;
  }
  let streak = 0;
  let k = anchor;
  while (daySet.has(k)) {
    streak++;
    k = addDaysToYmd(k, -1);
  }
  return streak;
}

export function getStreakMessage(streak) {
  if (streak <= 0) return { streakLine: null, milestoneLine: null };
  const milestones = {
    1: "We logged an injection today.",
    2: "Two in a row. It has happened before.",
    3: "Three days. That's a streak. Lou Brown would be proud.",
    7: "One week. The peptides are starting to believe.",
    10: "Ten days. Double digits. Your cells have stopped asking questions.",
    14: "Two weeks straight. Your cells have filed a formal thank you.",
    21: "21 days. Science says this is a habit now. Science is right.",
    30: "30 days. One month. Adipose tissue is scared of you.",
    45: "45 days. Your mitochondria have started showing up early.",
    60: "60 days. Two months. You're not biohacking anymore. You're just living differently.",
    75: "75 days. Your doctor has noticed something. They don't know what.",
    90: "90 days. The FDA still doesn't know. Stack logged.",
    100: "100 days. Big Pharma started taking their own pills to feel as good as you.",
    120: "120 days. Your cells have unionized. They're demanding better fuel.",
    150: "150 days. Five months. You've outlasted most New Year's resolutions by 120 days.",
    180: "Six months. You've logged more doses than most people take supplements.",
    200: "200 days. Your future self just sent a thank you note. Retroactively.",
    250: "250 days. At this point the peptides are taking themselves.",
    300: "300 days. Your mitochondria have a pension plan now.",
    365: "One year. 365 days. You absolute unit. The FDA filed a report about you specifically.",
    500: "500 days. This isn't a streak anymore. This is a lifestyle. Stack logged.",
    1000: "1000 days. We don't have words. The peptides do. They said thank you.",
  };
  return {
    streakLine: `🔥 Day ${streak} streak`,
    milestoneLine: milestones[streak] ?? null,
  };
}

export function getStreakResetMessage() {
  return "Streak reset. Day 1.\nWe logged an injection today.\nIf we log tomorrow, it's called two in a row.\nIt has happened before.";
}
