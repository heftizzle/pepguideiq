export function calculateStreak(dosedAtIsos) {
  if (!dosedAtIsos || dosedAtIsos.length === 0) return 0;
  const uniqueDays = [...new Set(
    dosedAtIsos.map((iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    })
  )].sort().reverse();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) return 0;
  let streak = 0;
  let cursor = new Date(uniqueDays[0]);
  for (const day of uniqueDays) {
    const cursorStr = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;
    if (day === cursorStr) { streak++; cursor.setDate(cursor.getDate()-1); }
    else break;
  }
  return streak;
}

export function getStreakMessage(streak) {
  if (streak <= 0) return { streakLine: null, milestoneLine: null };
  const milestones = {
    1:   "We logged an injection today.",
    2:   "Two in a row. It has happened before.",
    3:   "Three days. That's a streak. Lou Brown would be proud.",
    7:   "One week. The peptides are starting to believe.",
    10:  "Ten days. Double digits. Your cells have stopped asking questions.",
    14:  "Two weeks straight. Your cells have filed a formal thank you.",
    21:  "21 days. Science says this is a habit now. Science is right.",
    30:  "30 days. One month. Adipose tissue is scared of you.",
    45:  "45 days. Your mitochondria have started showing up early.",
    60:  "60 days. Two months. You're not biohacking anymore. You're just living differently.",
    75:  "75 days. Your doctor has noticed something. They don't know what.",
    90:  "90 days. The FDA still doesn't know. Stack logged.",
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
