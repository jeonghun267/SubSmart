"use client";

import { useEffect } from "react";
import { completeQuestWithReward } from "@/lib/daily-quest";

/**
 * 페이지 방문 시 해당 퀘스트를 자동완료하는 훅
 * page-visit 타입 퀘스트에 사용합니다.
 */

// 페이지 경로 → 퀘스트 ID 매핑
const PAGE_QUEST_MAP: Record<string, string[]> = {
  "/subscriptions": ["check_subs"],
  "/budget": ["check_budget", "search_expenses"],
  "/report": ["compare_last_month"],
};

export function usePageQuest(pathname: string) {
  useEffect(() => {
    const questIds = PAGE_QUEST_MAP[pathname];
    if (!questIds) return;

    for (const questId of questIds) {
      completeQuestWithReward(questId);
    }

    // 대시보드에 변경 알림
    window.dispatchEvent(new Event("subsmart:quest-update"));
  }, [pathname]);
}
