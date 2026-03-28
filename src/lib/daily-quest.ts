/**
 * 일일 퀘스트 시스템
 * localStorage 기반으로 오늘의 퀘스트 완료 상태를 관리합니다.
 */

import { format } from "date-fns";

const QUEST_KEY = "subsmart_daily_quests";

export interface DailyQuests {
  date: string;
  appOpen: boolean;
  recordExpense: boolean;
  readTip: boolean;
}

function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getDailyQuests(): DailyQuests {
  if (typeof window === "undefined") {
    return { date: getToday(), appOpen: false, recordExpense: false, readTip: false };
  }

  const raw = localStorage.getItem(QUEST_KEY);
  if (!raw) {
    return { date: getToday(), appOpen: false, recordExpense: false, readTip: false };
  }

  const parsed = JSON.parse(raw) as DailyQuests;
  // 날짜가 다르면 초기화
  if (parsed.date !== getToday()) {
    return { date: getToday(), appOpen: false, recordExpense: false, readTip: false };
  }
  return parsed;
}

function saveQuests(quests: DailyQuests) {
  localStorage.setItem(QUEST_KEY, JSON.stringify(quests));
}

export function completeQuest(quest: "appOpen" | "recordExpense" | "readTip"): {
  quests: DailyQuests;
  justCompleted: boolean;
  allClear: boolean;
} {
  const quests = getDailyQuests();
  const wasComplete = quests[quest];
  quests[quest] = true;
  quests.date = getToday();
  saveQuests(quests);

  const allClear = quests.appOpen && quests.recordExpense && quests.readTip;
  return { quests, justCompleted: !wasComplete, allClear };
}

export function getCompletedCount(): number {
  const q = getDailyQuests();
  return [q.appOpen, q.recordExpense, q.readTip].filter(Boolean).length;
}

export function isAllClear(): boolean {
  return getCompletedCount() === 3;
}
