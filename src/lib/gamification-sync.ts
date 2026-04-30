/**
 * 게이미피케이션 Supabase 동기화
 * localStorage (빠른 읽기) + Supabase (영구 저장) 하이브리드 방식
 *
 * 앱 시작 시: Supabase → localStorage 로드 (서버 데이터가 기기 변경 시에도 유지됨)
 * XP/퀘스트 변경 시: localStorage → Supabase 백그라운드 동기화
 */

import { supabase } from "./supabase";

/**
 * 앱 시작 시 Supabase에서 게이미피케이션 데이터를 로드해 localStorage에 반영합니다.
 * 서버 XP가 로컬보다 크거나 같으면 서버 데이터로 덮어씁니다.
 */
export async function initGamification(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return;

    // 서버 XP가 로컬보다 크면 서버 데이터로 업데이트 (기기 이동 시 복구)
    const localXp = parseInt(localStorage.getItem("subsmart_subby_xp") || "0", 10);
    if (data.xp >= localXp) {
      localStorage.setItem("subsmart_subby_xp", String(data.xp));
    }

    // 퀘스트 동기화 — 오늘 날짜인 경우에만 서버 데이터로 복원
    if (data.quests_date) {
      const today = new Date().toISOString().split("T")[0];
      if (data.quests_date === today) {
        const questData = {
          date: data.quests_date,
          selectedIds: data.quests_selected || [],
          completedIds: data.quests_completed || [],
        };
        localStorage.setItem("subsmart_daily_quests", JSON.stringify(questData));

        if (data.daily_record_date === today) {
          localStorage.setItem(
            "subsmart_daily_record_count",
            JSON.stringify({ date: data.daily_record_date, count: data.daily_record_count || 0 })
          );
        }
      }
    }

    // 통계 동기화 — 서버/로컬 중 더 큰 값 사용
    const rawStats = localStorage.getItem("subsmart_subby_stats");
    const localStats = rawStats ? JSON.parse(rawStats) : {};
    const merged = {
      questsCompleted: Math.max(localStats.questsCompleted || 0, data.stats_quests_completed || 0),
      longestStreak: Math.max(localStats.longestStreak || 0, data.stats_longest_streak || 0),
      allClearCount: Math.max(localStats.allClearCount || 0, data.stats_all_clear_count || 0),
      daysActive: Math.max(localStats.daysActive || 0, data.stats_days_active || 0),
    };
    localStorage.setItem("subsmart_subby_stats", JSON.stringify(merged));
  } catch {
    // 초기화 실패 시 기존 localStorage 데이터 유지
  }
}

/**
 * 현재 localStorage 상태를 Supabase에 저장합니다.
 * XP 변경, 퀘스트 완료 후 호출하세요. (디바운스 처리 권장)
 */
export async function syncGamification(userId: string): Promise<void> {
  try {
    const xp = parseInt(localStorage.getItem("subsmart_subby_xp") || "0", 10);

    let questsDate: string | null = null;
    let questsCompleted: string[] = [];
    let questsSelected: string[] = [];
    const rawQuests = localStorage.getItem("subsmart_daily_quests");
    if (rawQuests) {
      const q = JSON.parse(rawQuests);
      questsDate = q.date || null;
      questsCompleted = q.completedIds || [];
      questsSelected = q.selectedIds || [];
    }

    let recordDate: string | null = null;
    let recordCount = 0;
    const rawRecord = localStorage.getItem("subsmart_daily_record_count");
    if (rawRecord) {
      const r = JSON.parse(rawRecord);
      recordDate = r.date || null;
      recordCount = r.count || 0;
    }

    const rawStats = localStorage.getItem("subsmart_subby_stats");
    const stats = rawStats ? JSON.parse(rawStats) : {};

    await supabase.from("user_gamification").upsert({
      user_id: userId,
      xp,
      quests_date: questsDate,
      quests_completed: questsCompleted,
      quests_selected: questsSelected,
      daily_record_count: recordCount,
      daily_record_date: recordDate,
      stats_quests_completed: stats.questsCompleted || 0,
      stats_longest_streak: stats.longestStreak || 0,
      stats_all_clear_count: stats.allClearCount || 0,
      stats_days_active: stats.daysActive || 0,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // 동기화 실패 시 조용히 무시 (localStorage는 유지됨)
  }
}

/**
 * Supabase user_plans 테이블에서 프리미엄 상태를 로드해 localStorage에 반영합니다.
 * 앱 시작 시 호출해 localStorage를 서버 상태와 동기화합니다.
 */
export async function initPremium(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("user_plans")
      .select("plan")
      .eq("user_id", userId)
      .single();

    if (!data) {
      localStorage.removeItem("subsmart_plan");
      return;
    }

    if (data.plan === "premium") {
      localStorage.setItem("subsmart_plan", "premium");
    } else {
      localStorage.removeItem("subsmart_plan");
    }
  } catch {
    // 실패 시 기존 localStorage 상태 유지
  }
}
