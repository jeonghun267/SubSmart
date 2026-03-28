/**
 * 써비 레벨/XP 시스템
 * localStorage 기반으로 XP를 관리하고 레벨을 계산합니다.
 */

const XP_KEY = "subsmart_subby_xp";

// 레벨 테이블: [필요 누적 XP, 레벨명, 설명]
export const LEVEL_TABLE = [
  { level: 1, minXp: 0, name: "아기 코인", desc: "이제 막 태어난 써비" },
  { level: 2, minXp: 30, name: "반짝 코인", desc: "기록의 힘을 깨달은 써비" },
  { level: 3, minXp: 80, name: "왕관 코인", desc: "꾸준한 기록왕 써비" },
  { level: 4, minXp: 150, name: "빛나는 코인", desc: "절약의 달인 써비" },
  { level: 5, minXp: 250, name: "금빛 코인", desc: "돈 관리 마스터 써비" },
  { level: 6, minXp: 400, name: "다이아 코인", desc: "전설의 시작 써비" },
  { level: 7, minXp: 600, name: "무지개 코인", desc: "전설의 써비" },
];

export function getSubbyXp(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

export function addSubbyXp(amount: number): { newXp: number; leveledUp: boolean; newLevel: number } {
  const oldXp = getSubbyXp();
  const oldLevel = getSubbyLevel(oldXp);
  const newXp = oldXp + amount;
  localStorage.setItem(XP_KEY, String(newXp));
  const newLevel = getSubbyLevel(newXp);
  return { newXp, leveledUp: newLevel > oldLevel, newLevel };
}

export function getSubbyLevel(xp?: number): number {
  const currentXp = xp ?? getSubbyXp();
  let level = 1;
  for (const entry of LEVEL_TABLE) {
    if (currentXp >= entry.minXp) level = entry.level;
  }
  return level;
}

export function getSubbyLevelInfo(level?: number) {
  const lv = level ?? getSubbyLevel();
  return LEVEL_TABLE.find((e) => e.level === lv) || LEVEL_TABLE[0];
}

export function getXpToNextLevel(xp?: number): { current: number; needed: number; progress: number } {
  const currentXp = xp ?? getSubbyXp();
  const currentLevel = getSubbyLevel(currentXp);
  const nextEntry = LEVEL_TABLE.find((e) => e.level === currentLevel + 1);

  if (!nextEntry) {
    return { current: currentXp, needed: currentXp, progress: 100 };
  }

  const currentEntry = LEVEL_TABLE.find((e) => e.level === currentLevel)!;
  const rangeStart = currentEntry.minXp;
  const rangeEnd = nextEntry.minXp;
  const progress = Math.round(((currentXp - rangeStart) / (rangeEnd - rangeStart)) * 100);

  return { current: currentXp, needed: rangeEnd, progress: Math.min(progress, 100) };
}

// XP 보상 상수
export const XP_REWARDS = {
  APP_OPEN: 1,
  RECORD_EXPENSE: 3,
  READ_TIP: 3,
  DAILY_ALL_CLEAR: 10,
  STREAK_7: 20,
  STREAK_30: 100,
  BUDGET_UNDER: 5,
} as const;
