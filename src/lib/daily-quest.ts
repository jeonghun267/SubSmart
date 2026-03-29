/**
 * 일일 퀘스트 시스템
 * localStorage 기반으로 오늘의 퀘스트 완료 상태를 관리합니다.
 * quest-pool.ts에서 매일 선택된 퀘스트를 사용합니다.
 */

import { format } from "date-fns";
import { getTodayQuests, getQuestById } from "./quest-pool";
import type { Quest } from "./quest-pool";
import { addSubbyXp, XP_REWARDS } from "./subby-level";
import { recordStat } from "./subby-stats";

const QUEST_KEY = "subsmart_daily_quests";
const RECORD_COUNT_KEY = "subsmart_daily_record_count";

export interface DailyQuests {
  date: string;
  selectedIds: string[];
  completedIds: string[];
}

function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getDailyQuests(): DailyQuests {
  const today = getToday();
  const todayQuests = getTodayQuests(today);
  const selectedIds = todayQuests.map((q) => q.id);

  if (typeof window === "undefined") {
    return { date: today, selectedIds, completedIds: [] };
  }

  const raw = localStorage.getItem(QUEST_KEY);
  if (!raw) {
    return { date: today, selectedIds, completedIds: [] };
  }

  const parsed = JSON.parse(raw) as DailyQuests;
  // 날짜가 다르면 초기화
  if (parsed.date !== today) {
    return { date: today, selectedIds, completedIds: [] };
  }

  // 날짜가 같으면 완료 상태 유지, selectedIds는 항상 최신으로
  // 이전 포맷(appOpen/recordExpense/readTip) 호환 처리
  const completedIds = Array.isArray(parsed.completedIds) ? parsed.completedIds : [];
  return { date: today, selectedIds, completedIds };
}

function saveQuests(quests: DailyQuests) {
  localStorage.setItem(QUEST_KEY, JSON.stringify(quests));
}

export function completeQuest(questId: string): {
  quests: DailyQuests;
  justCompleted: boolean;
  allClear: boolean;
  quest: Quest | undefined;
} {
  const quests = getDailyQuests();
  const wasComplete = quests.completedIds.includes(questId);

  if (!wasComplete) {
    quests.completedIds.push(questId);
  }

  quests.date = getToday();
  saveQuests(quests);

  const allClear = quests.completedIds.length >= quests.selectedIds.length &&
    quests.selectedIds.every((id) => quests.completedIds.includes(id));

  return {
    quests,
    justCompleted: !wasComplete,
    allClear,
    quest: getQuestById(questId),
  };
}

export function isQuestCompleted(questId: string): boolean {
  const quests = getDailyQuests();
  return quests.completedIds.includes(questId);
}

export function getCompletedCount(): number {
  const q = getDailyQuests();
  return q.completedIds.filter((id) => q.selectedIds.includes(id)).length;
}

/**
 * 오늘의 지출 기록 건수를 증가시키고 반환합니다.
 * record_3 퀘스트 자동완료에 사용됩니다.
 */
export function incrementRecordCount(): number {
  if (typeof window === "undefined") return 0;
  const today = getToday();
  const raw = localStorage.getItem(RECORD_COUNT_KEY);
  let data: { date: string; count: number } = { date: today, count: 0 };
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed.date === today) data = parsed;
  }
  data.date = today;
  data.count += 1;
  localStorage.setItem(RECORD_COUNT_KEY, JSON.stringify(data));
  return data.count;
}

export function getTodayRecordCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(RECORD_COUNT_KEY);
  if (!raw) return 0;
  const parsed = JSON.parse(raw);
  return parsed.date === getToday() ? parsed.count : 0;
}

export function isAllClear(): boolean {
  const q = getDailyQuests();
  return q.selectedIds.length > 0 &&
    q.selectedIds.every((id) => q.completedIds.includes(id));
}

/**
 * 퀘스트 완료 + XP 지급 + stats 기록을 한 번에 처리하는 헬퍼
 * UI에서 반복되는 로직을 통합합니다.
 */
export interface QuestRewardResult {
  quests: DailyQuests;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  justCompleted: boolean;
  allClear: boolean;
}

export function completeQuestWithReward(questId: string): QuestRewardResult {
  const result = completeQuest(questId);
  let xpGained = 0;
  let newXp = 0;
  let newLevel = 1;
  let leveledUp = false;

  if (result.justCompleted && result.quest) {
    const xpResult = addSubbyXp(result.quest.xp);
    xpGained += result.quest.xp;
    newXp = xpResult.newXp;
    newLevel = xpResult.newLevel;
    leveledUp = xpResult.leveledUp;
    recordStat("questCompleted");
  }

  if (result.allClear) {
    const bonus = addSubbyXp(XP_REWARDS.DAILY_ALL_CLEAR);
    xpGained += XP_REWARDS.DAILY_ALL_CLEAR;
    newXp = bonus.newXp;
    if (bonus.leveledUp) {
      newLevel = bonus.newLevel;
      leveledUp = true;
    }
    recordStat("allClear");
  }

  return {
    quests: result.quests,
    xpGained,
    newXp,
    newLevel,
    leveledUp,
    justCompleted: result.justCompleted,
    allClear: result.allClear,
  };
}
