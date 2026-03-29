/**
 * 써비 통계 추적 (localStorage 기반)
 * Subby의 성장 기록을 관리합니다.
 */

const STATS_KEY = "subsmart_subby_stats";

export interface SubbyStats {
  totalXp: number;
  questsCompleted: number;
  longestStreak: number;
  allClearCount: number;
  daysActive: number;
}

interface StoredStats {
  questsCompleted: number;
  longestStreak: number;
  allClearCount: number;
  daysActive: number;
}

const DEFAULT_STATS: StoredStats = {
  questsCompleted: 0,
  longestStreak: 0,
  allClearCount: 0,
  daysActive: 0,
};

function loadStats(): StoredStats {
  if (typeof window === "undefined") return { ...DEFAULT_STATS };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats: StoredStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export type StatType = "questCompleted" | "allClear" | "dayActive" | "streak";

/**
 * 통계 항목을 기록합니다.
 * @param type - 기록할 통계 유형
 * @param value - streak의 경우 현재 연속 일수를 전달 (최고 기록만 저장)
 */
export function recordStat(type: StatType, value?: number): void {
  const stats = loadStats();

  switch (type) {
    case "questCompleted":
      stats.questsCompleted += 1;
      break;
    case "allClear":
      stats.allClearCount += 1;
      break;
    case "dayActive":
      stats.daysActive += 1;
      break;
    case "streak":
      if (value !== undefined && value > stats.longestStreak) {
        stats.longestStreak = value;
      }
      break;
  }

  saveStats(stats);
}

/**
 * 전체 써비 통계를 반환합니다.
 * totalXp는 subby-level의 localStorage에서 직접 읽습니다.
 */
export function getStats(): SubbyStats {
  const stored = loadStats();
  let totalXp = 0;
  if (typeof window !== "undefined") {
    totalXp = parseInt(localStorage.getItem("subsmart_subby_xp") || "0", 10);
  }

  return {
    totalXp,
    questsCompleted: stored.questsCompleted,
    longestStreak: stored.longestStreak,
    allClearCount: stored.allClearCount,
    daysActive: stored.daysActive,
  };
}
