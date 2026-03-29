/**
 * 퀘스트 풀 시스템
 * 15개의 가계부 관련 퀘스트 중 매일 3개를 선택합니다.
 */

import { format } from "date-fns";

export type QuestDifficulty = "easy" | "medium" | "hard";
export type QuestCheckType = "auto" | "manual" | "page-visit";

export interface Quest {
  id: string;
  name: string;
  description: string;
  difficulty: QuestDifficulty;
  xp: number;
  checkType: QuestCheckType;
}

// ── 쉬움 (5개) ──────────────────────────────────────
const EASY_QUESTS: Quest[] = [
  {
    id: "app_open",
    name: "앱 열기",
    description: "SubSmart에 접속하기",
    difficulty: "easy",
    xp: 1,
    checkType: "auto",
  },
  {
    id: "record_1",
    name: "지출 1건 기록",
    description: "오늘 지출을 1건 기록해보세요",
    difficulty: "easy",
    xp: 3,
    checkType: "auto",
  },
  {
    id: "check_subs",
    name: "구독 목록 확인",
    description: "구독 관리 페이지를 확인해보세요",
    difficulty: "easy",
    xp: 2,
    checkType: "page-visit",
  },
  {
    id: "check_budget",
    name: "예산 확인",
    description: "이번 달 예산 현황을 확인해보세요",
    difficulty: "easy",
    xp: 2,
    checkType: "page-visit",
  },
  {
    id: "read_tip",
    name: "AI 팁 읽기",
    description: "AI 절약 팁을 읽어보세요",
    difficulty: "easy",
    xp: 3,
    checkType: "manual",
  },
];

// ── 보통 (6개) ──────────────────────────────────────
const MEDIUM_QUESTS: Quest[] = [
  {
    id: "record_3",
    name: "지출 3건 기록",
    description: "오늘 지출을 3건 이상 기록해보세요",
    difficulty: "medium",
    xp: 5,
    checkType: "auto",
  },
  {
    id: "under_daily_budget",
    name: "일일 예산 내 지출",
    description: "오늘 하루 예산을 초과하지 않기",
    difficulty: "medium",
    xp: 5,
    checkType: "auto",
  },
  {
    id: "compare_last_month",
    name: "지난달 비교 확인",
    description: "지난달 대비 지출 변화를 확인해보세요",
    difficulty: "medium",
    xp: 4,
    checkType: "page-visit",
  },
  {
    id: "set_budget",
    name: "예산 설정/수정",
    description: "카테고리 예산을 설정하거나 수정해보세요",
    difficulty: "medium",
    xp: 5,
    checkType: "auto",
  },
  {
    id: "search_expenses",
    name: "가계부 검색해보기",
    description: "지출 내역을 검색해보세요",
    difficulty: "medium",
    xp: 4,
    checkType: "page-visit",
  },
  {
    id: "add_savings",
    name: "목표 저축에 적립",
    description: "저축 목표에 금액을 적립해보세요",
    difficulty: "medium",
    xp: 5,
    checkType: "auto",
  },
];

// ── 어려움 (4개) ──────────────────────────────────────
const HARD_QUESTS: Quest[] = [
  {
    id: "zero_spending",
    name: "무지출 데이",
    description: "오늘 하루 지출 0원 달성하기",
    difficulty: "hard",
    xp: 10,
    checkType: "auto",
  },
  {
    id: "cancel_sub",
    name: "구독 1건 정리",
    description: "불필요한 구독을 1건 해지해보세요",
    difficulty: "hard",
    xp: 10,
    checkType: "auto",
  },
  {
    id: "streak_7",
    name: "7일 연속 접속 유지",
    description: "7일 연속으로 SubSmart를 사용해보세요",
    difficulty: "hard",
    xp: 20,
    checkType: "auto",
  },
  {
    id: "monthly_review",
    name: "월초 예산 점검",
    description: "이번 달 예산 계획을 점검하고 정리해보세요",
    difficulty: "hard",
    xp: 10,
    checkType: "manual",
  },
];

export const ALL_QUESTS: Quest[] = [...EASY_QUESTS, ...MEDIUM_QUESTS, ...HARD_QUESTS];

/**
 * 날짜 문자열을 시드로 사용하는 결정적 랜덤 함수
 * 같은 날짜면 항상 같은 결과를 반환합니다.
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return () => {
    hash = (hash * 1664525 + 1013904223) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

/**
 * 날짜 시드 기반으로 배열에서 n개 선택
 */
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * 오늘의 퀘스트 3개를 반환합니다.
 * 구성: 쉬움 1개 + 보통 1개 + 어려움 1개  또는  쉬움 1개 + 보통 2개
 * 날짜 기반 시드로 결정적이므로, 같은 날이면 항상 같은 퀘스트가 나옵니다.
 * "app_open"은 항상 포함됩니다.
 */
export function getTodayQuests(dateStr?: string): Quest[] {
  const today = dateStr || format(new Date(), "yyyy-MM-dd");
  const rng = seededRandom(today);

  // app_open은 항상 쉬움 슬롯으로 포함
  const easyPick: Quest = EASY_QUESTS.find((q) => q.id === "app_open")!;

  // 보통/어려움 결정: rng로 50/50
  const useHard = rng() > 0.5;

  if (useHard) {
    // 쉬움 1 + 보통 1 + 어려움 1
    const mediumPick = pickN(MEDIUM_QUESTS, 1, rng);
    const hardPick = pickN(HARD_QUESTS, 1, rng);
    return [easyPick, ...mediumPick, ...hardPick];
  } else {
    // 쉬움 1 + 보통 2
    const mediumPicks = pickN(MEDIUM_QUESTS, 2, rng);
    return [easyPick, ...mediumPicks];
  }
}

/**
 * quest id로 퀘스트 정보를 찾습니다.
 */
export function getQuestById(id: string): Quest | undefined {
  return ALL_QUESTS.find((q) => q.id === id);
}
