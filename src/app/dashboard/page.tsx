"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Subscription, Transaction, Budget, CATEGORIES, getCategoryInfo } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { advancePastBillingDates } from "@/lib/billing";
import { authFetch } from "@/lib/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Flame,
  Wallet,
  Share2,
  Plus,
} from "lucide-react";
import { shareToss } from "@/lib/apps-in-toss";
import Link from "next/link";
import AnimatedNumber from "@/components/AnimatedNumber";
import DonutChart from "@/components/DonutChart";
import ProgressBar from "@/components/ProgressBar";
import { DashboardSkeleton } from "@/components/Skeleton";
import BottomSheet from "@/components/BottomSheet";
import { useNotifications } from "@/components/NotificationManager";
import { checkBillingAlerts } from "@/lib/notifications";
import Onboarding, { hasSeenOnboarding } from "@/components/Onboarding";
import Subby from "@/components/Subby";
import { getSubbyXp, getSubbyLevel, getXpToNextLevel, getSubbyLevelInfo } from "@/lib/subby-level";
import { getDailyQuests, completeQuestWithReward } from "@/lib/daily-quest";
import { recordStat } from "@/lib/subby-stats";
import { getTodayQuests } from "@/lib/quest-pool";
import type { Quest } from "@/lib/quest-pool";

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [lastMonthExpense, setLastMonthExpense] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState("");
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotiSheet, setShowNotiSheet] = useState(false);
  const [streak, setStreak] = useState(0);
  const [subbyXp, setSubbyXp] = useState(0);
  const [subbyLevel, setSubbyLevel] = useState(1);
  const [quests, setQuests] = useState(getDailyQuests());
  const [todayQuests, setTodayQuests] = useState<Quest[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const { sendNotification, enabled: notiEnabled, enableNotifications } = useNotifications();

  useEffect(() => {
    if (!hasSeenOnboarding()) setShowOnboarding(true);
    // Load XP
    setSubbyXp(getSubbyXp());
    setSubbyLevel(getSubbyLevel());
    // Load today's quests from pool
    setTodayQuests(getTodayQuests());
    // Complete "app open" quest (auto) + record daily active
    recordStat("dayActive");
    const result = completeQuestWithReward("app_open");
    setQuests(result.quests);
    setSubbyXp(result.newXp || getSubbyXp());
    setSubbyLevel(result.newLevel || getSubbyLevel());
    if (result.leveledUp) { setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 2000); }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    loadData();
    const handleRefresh = () => loadData();
    const handleQuestUpdate = () => {
      setQuests(getDailyQuests());
      setSubbyXp(getSubbyXp());
      setSubbyLevel(getSubbyLevel());
    };
    window.addEventListener("subsmart:refresh", handleRefresh);
    window.addEventListener("subsmart:quest-update", handleQuestUpdate);
    return () => {
      window.removeEventListener("subsmart:refresh", handleRefresh);
      window.removeEventListener("subsmart:quest-update", handleQuestUpdate);
    };
  }, [authUser]);

  async function loadData() {
    if (!authUser) return;

    setUserName(authUser.name || "사용자");

    const now = new Date();
    const monthStart = format(now, "yyyy-MM-01");
    const monthEnd = format(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
      "yyyy-MM-dd"
    );
    const curMonth = format(now, "yyyy-MM");

    // Last month range
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = format(lastMonth, "yyyy-MM-01");
    const lastMonthEnd = format(
      new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
      "yyyy-MM-dd"
    );

    const [subsRes, txRes, lastTxRes, budgetRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("is_active", true)
        .order("next_billing_date", { ascending: true }),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false }),
      supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", authUser.id)
        .eq("type", "expense")
        .gte("date", lastMonthStart)
        .lte("date", lastMonthEnd),
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("month", curMonth),
    ]);

    const subs = subsRes.data || [];
    const txs = txRes.data || [];
    const lastTxs = lastTxRes.data || [];
    const buds = budgetRes.data || [];

    // Calculate last month expense
    const lastTotal = lastTxs.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
    setLastMonthExpense(lastTotal);

    // Auto-advance past billing dates
    const { updatedIds } = advancePastBillingDates(subs);
    if (updatedIds.length > 0) {
      await Promise.all(
        updatedIds.map(({ id, next_billing_date }) =>
          supabase.from("subscriptions").update({ next_billing_date }).eq("id", id).then()
        )
      );
    }

    setSubscriptions(subs);
    setTransactions(txs);
    setBudgets(buds);

    // Calculate streak (consecutive days with at least 1 transaction)
    const txDates = new Set(txs.map((t: Transaction) => t.date));
    let streakCount = 0;
    const d = new Date();
    // Check if today has a record, if not start from yesterday
    const todayStr = format(d, "yyyy-MM-dd");
    if (!txDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const ds = format(d, "yyyy-MM-dd");
      if (txDates.has(ds)) {
        streakCount++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(streakCount);

    // streak stats 기록 + streak_7 퀘스트 자동완료
    if (streakCount > 0) {
      recordStat("streak", streakCount);
    }
    if (streakCount >= 7) {
      const streakResult = completeQuestWithReward("streak_7");
      if (streakResult.xpGained > 0) {
        setSubbyXp(streakResult.newXp);
        setSubbyLevel(streakResult.newLevel);
        setQuests(streakResult.quests);
        if (streakResult.leveledUp) { setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 2000); }
      }
    }

    setLoading(false);

    // Check billing alerts
    if (notiEnabled) {
      checkBillingAlerts(subs, sendNotification);
    }

    // Fetch AI tip in background
    setAiTipLoading(true);
    authFetch("/api/ai-insight", {
      method: "POST",
      body: JSON.stringify({
        subscriptions: subs.filter((s: Subscription) => s.is_active),
        transactions: txs,
        type: "tip",
      }),
    })
      .then((res) => res.json())
      .then((data) => setAiTip(data.insight || ""))
      .catch(() => setAiTip(""))
      .finally(() => setAiTipLoading(false));
  }

  const totalMonthlySubscription = subscriptions.reduce((sum, s) => {
    if (s.billing_cycle === "yearly") return sum + s.amount / 12;
    if (s.billing_cycle === "weekly") return sum + s.amount * 4;
    return sum + s.amount;
  }, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpending = totalExpense + Math.round(totalMonthlySubscription);

  // Last month comparison
  const lastMonthDiff = lastMonthExpense !== null ? totalExpense - lastMonthExpense : null;
  const lastMonthPercent = lastMonthExpense && lastMonthExpense > 0
    ? Math.round(((totalExpense - lastMonthExpense) / lastMonthExpense) * 100)
    : null;

  // Budget progress
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const budgetUsedPercent = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0;

  // Category expense for budget
  const categoryExpenseMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryExpenseMap.set(t.category, (categoryExpenseMap.get(t.category) || 0) + t.amount);
    });

  const upcomingBills = subscriptions
    .filter((s) => {
      const d = new Date(s.next_billing_date);
      const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    })
    .slice(0, 3);

  // Donut chart data from expense categories
  const categoryTotals = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals.set(
        t.category,
        (categoryTotals.get(t.category) || 0) + t.amount
      );
    });
  subscriptions.forEach((s) => {
    const monthly =
      s.billing_cycle === "yearly"
        ? s.amount / 12
        : s.billing_cycle === "weekly"
        ? s.amount * 4
        : s.amount;
    categoryTotals.set(
      s.category,
      (categoryTotals.get(s.category) || 0) + Math.round(monthly)
    );
  });

  const donutSegments = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, val]) => ({
      label: getCategoryInfo(cat).label,
      value: val,
      color: getCategoryInfo(cat).color,
    }));

  // Daily wallet: remaining budget / remaining days
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - now.getDate() + 1; // including today
  const budgetRemaining = totalBudget > 0 ? totalBudget - totalExpense : 0;
  const dailyBudget = totalBudget > 0 && remainingDays > 0 ? Math.round(budgetRemaining / remainingDays) : 0;

  // Subby mood based on streak
  // Subby mood: level-up celebration > streak-based > quest-based
  const subbyMood: "happy" | "worried" | "thinking" | "wink" | "sleepy" | "celebration" =
    showLevelUp ? "celebration" :
    streak >= 7 ? "happy" :
    streak >= 3 ? "wink" :
    streak >= 1 ? "thinking" :
    streak === 0 && subbyXp > 0 ? "sleepy" :
    "worried";

  const xpProgress = getXpToNextLevel(subbyXp);
  const levelInfo = getSubbyLevelInfo(subbyLevel);

  // Better center value for donut
  function formatShortAmount(n: number): string {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
    if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}만`;
    return n.toLocaleString();
  }

  if (loading) return <DashboardSkeleton />;

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Subby size={36} mood={subbyMood} level={subbyLevel} />
          <div>
            <p className="text-text-tertiary text-[13px]">안녕하세요,</p>
            <h1 className="text-[22px] font-bold text-text-primary mt-0.5 truncate max-w-[140px]">
              {userName}님
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-[10px]">
              <Flame size={14} className="text-amber-500" />
              <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{streak}일</span>
            </div>
          )}
          <button
            onClick={() => setShowNotiSheet(true)}
            className="relative p-2.5 rounded-[12px] bg-bg-card border border-border pressable"
          >
            <Bell size={20} className="text-text-secondary" />
            {upcomingBills.length > 0 && (
              <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-negative rounded-full text-text-inverse text-[10px] font-bold flex items-center justify-center">
                {upcomingBills.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Daily Quest Card */}
      <div className="bg-bg-card rounded-[16px] p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Subby size={28} mood={subbyMood} level={subbyLevel} />
            <div>
              <p className="text-[13px] font-semibold text-text-primary">오늘의 미션</p>
              <p className="text-[10px] text-text-tertiary">Lv.{subbyLevel} {levelInfo.name}</p>
            </div>
          </div>
          <Link
            href="/subby-home"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent-soft rounded-[10px] pressable"
          >
            <span className="text-[11px] font-bold text-accent tabular-nums">{subbyXp} XP</span>
            <ChevronRight size={12} className="text-accent" />
          </Link>
        </div>

        {/* Quest items */}
        <div className="space-y-2">
          {todayQuests.map((quest) => {
            const done = quests.completedIds.includes(quest.id);
            const isManual = quest.checkType === "manual" || quest.checkType === "page-visit";
            return (
              <div
                key={quest.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] ${done ? "bg-positive-soft" : "bg-bg-primary"} ${!done && isManual ? "pressable cursor-pointer" : ""}`}
                onClick={() => {
                  if (!done && isManual) {
                    const r = completeQuestWithReward(quest.id);
                    setQuests(r.quests);
                    if (r.xpGained > 0) { setSubbyXp(r.newXp); setSubbyLevel(r.newLevel); }
                    if (r.leveledUp) { setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 2000); }
                  }
                }}
              >
                <span className="text-[14px]">{done ? "✅" : "⬜"}</span>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[12px] ${done ? "text-positive font-medium line-through" : "text-text-secondary"}`}>{quest.name}</span>
                  {!done && <span className="text-[10px] text-text-tertiary truncate">{quest.description}</span>}
                </div>
                <span className="text-[10px] text-text-tertiary ml-auto whitespace-nowrap">+{quest.xp} XP</span>
              </div>
            );
          })}
        </div>

        {/* XP Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
            <span>{quests.selectedIds.length > 0 && quests.selectedIds.every((id) => quests.completedIds.includes(id)) ? "🎉 올클리어!" : `${quests.completedIds.filter((id) => quests.selectedIds.includes(id)).length}/${quests.selectedIds.length} 완료`}</span>
            <span>Lv.{subbyLevel} → Lv.{subbyLevel + 1}까지 {xpProgress.needed - xpProgress.current} XP</span>
          </div>
          <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${xpProgress.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Wallet - 오늘 쓸 수 있는 돈 */}
      {totalBudget > 0 && (
        <div className="bg-bg-card rounded-[16px] p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-accent" />
            <span className="text-[13px] font-medium text-text-secondary">오늘 쓸 수 있는 돈</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-[32px] font-bold tabular-nums ${
                dailyBudget <= 0 ? "text-negative" : dailyBudget < 10000 ? "text-warning" : "text-text-primary"
              }`}>
                {dailyBudget > 0 ? dailyBudget.toLocaleString() : 0}
                <span className="text-[16px] font-semibold text-text-tertiary ml-1">원</span>
              </p>
              {dailyBudget <= 0 && budgetRemaining < 0 && (
                <p className="text-[12px] text-negative mt-0.5">
                  예산을 {Math.abs(budgetRemaining).toLocaleString()}원 초과했어요
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] text-text-tertiary">남은 예산</p>
              <p className="text-[13px] font-semibold text-text-secondary tabular-nums">
                {Math.max(0, budgetRemaining).toLocaleString()}원
              </p>
              <p className="text-[10px] text-text-tertiary">{remainingDays}일 남음</p>
            </div>
          </div>
        </div>
      )}

      {/* Total Spending Hero Card */}
      <div className="bg-accent rounded-[16px] p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

        <p className="text-white/80 text-[13px] relative z-10">
          {format(new Date(), "M월", { locale: ko })} 총 지출
        </p>
        <div className="mt-1.5 relative z-10">
          <AnimatedNumber
            value={totalSpending}
            suffix="원"
            className="text-[36px] font-bold text-white"
          />
        </div>

        {/* Last month comparison */}
        {lastMonthPercent !== null && (
          <div className="flex items-center gap-1 mt-1.5 relative z-10">
            {lastMonthDiff! > 0 ? (
              <TrendingUp size={14} className="text-white/80" />
            ) : (
              <TrendingDown size={14} className="text-white/80" />
            )}
            <p className="text-white/80 text-[12px] font-medium">
              지난달 대비{" "}
              <span className={lastMonthDiff! > 0 ? "text-red-200" : "text-green-200"}>
                {lastMonthDiff! > 0 ? "+" : ""}
                {lastMonthPercent}%
              </span>
              {" "}({lastMonthDiff! > 0 ? "+" : ""}{lastMonthDiff!.toLocaleString()}원)
            </p>
          </div>
        )}

        <div className="flex gap-5 mt-5 relative z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard size={12} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-[11px]">구독</p>
              <p className="text-white text-[13px] font-semibold tabular-nums">
                {Math.round(totalMonthlySubscription).toLocaleString()}원
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowDownRight size={12} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-[11px]">지출</p>
              <p className="text-white text-[13px] font-semibold tabular-nums">
                {totalExpense.toLocaleString()}원
              </p>
            </div>
          </div>
          {totalIncome > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowUpRight size={12} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-[11px]">수입</p>
                <p className="text-white text-[13px] font-semibold tabular-nums">
                  {totalIncome.toLocaleString()}원
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 공유 버튼 */}
        {totalSpending > 0 && (
          <button
            onClick={() => shareToss({
              title: "이번 달 SubSmart 지출 현황",
              text: `이번 달 총 ${totalSpending.toLocaleString()}원 지출 (구독 ${Math.round(totalMonthlySubscription).toLocaleString()}원 포함) — SubSmart으로 관리 중`,
              url: "https://sub-smart-delta.vercel.app",
            })}
            className="mt-4 relative z-10 flex items-center gap-1.5 text-white/70 text-[12px] pressable hover:text-white transition-colors"
          >
            <Share2 size={13} />
            공유하기
          </button>
        )}
      </div>

      {/* 첫 방문 Empty State — 구독도 거래도 없을 때 */}
      {subscriptions.length === 0 && transactions.length === 0 && (
        <div className="bg-bg-card rounded-[16px] p-5 border border-accent/20 border-dashed">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] bg-accent-soft flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-text-primary">시작이 반이에요!</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">첫 구독을 추가하면 모든 기능이 활성화돼요</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/subscriptions"
              className="flex items-center justify-between w-full bg-accent text-white px-4 py-3 rounded-[12px] pressable"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} />
                <span className="text-[14px] font-semibold">첫 구독 추가하기</span>
              </div>
              <ChevronRight size={16} />
            </Link>
            <p className="text-[11px] text-text-tertiary text-center">
              넷플릭스, 유튜브 프리미엄 등 인기 구독을 빠르게 추가할 수 있어요
            </p>
          </div>
        </div>
      )}

      {/* Budget Progress */}
      {totalBudget > 0 && (
        <Link href="/budget" className="block bg-bg-card rounded-[14px] p-4 border border-border pressable">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent" />
              <span className="text-[13px] font-semibold text-text-primary">이번 달 예산</span>
            </div>
            <span className={`text-[13px] font-bold tabular-nums ${
              budgetUsedPercent >= 100 ? "text-negative" : budgetUsedPercent >= 75 ? "text-warning" : "text-accent"
            }`}>
              {budgetUsedPercent}%
            </span>
          </div>
          <ProgressBar percentage={budgetUsedPercent} height={6} />
          <div className="flex justify-between mt-2 text-[11px] text-text-tertiary tabular-nums">
            <span>{totalExpense.toLocaleString()}원 사용</span>
            <span>{totalBudget.toLocaleString()}원 중</span>
          </div>
        </Link>
      )}

      {/* AI Tip */}
      {(aiTipLoading || aiTip) && (
        <Link
          href="/report"
          className="flex items-center gap-3 bg-bg-card rounded-[12px] p-4 border border-border pressable"
        >
          <Subby size={40} mood="wink" className="shrink-0" />
          {aiTipLoading ? (
            <div className="flex-1">
              <div className="h-3.5 bg-bg-primary rounded-full w-3/4 animate-pulse" />
            </div>
          ) : (
            <p className="flex-1 text-[13px] text-text-secondary leading-snug">
              {aiTip}
            </p>
          )}
          <ChevronRight size={14} className="text-text-tertiary shrink-0" />
        </Link>
      )}

      {/* Category Donut Chart */}
      {donutSegments.length > 0 && (
        <section className="bg-bg-card rounded-[16px] p-5 border border-border">
          <h2 className="text-[15px] font-semibold text-text-primary mb-4">
            카테고리별 지출
          </h2>
          <div className="flex items-center gap-5">
            <DonutChart
              segments={donutSegments}
              size={140}
              thickness={22}
              centerLabel="총 지출"
              centerValue={formatShortAmount(totalSpending) + "원"}
            />
            <div className="flex-1 space-y-2">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[12px] text-text-secondary flex-1 truncate">
                    {seg.label}
                  </span>
                  <span className="text-[12px] font-semibold text-text-primary tabular-nums">
                    {seg.value.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Bills */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            다가오는 결제
          </h2>
          <Link
            href="/subscriptions"
            className="text-accent text-[13px] font-medium flex items-center gap-0.5 pressable"
          >
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        {upcomingBills.length === 0 ? (
          <div className="bg-bg-card rounded-[12px] p-5 border border-border text-center">
            <p className="text-[13px] text-text-tertiary">
              7일 내 예정된 결제가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingBills.map((sub, i) => {
              const cat = getCategoryInfo(sub.category);
              const d = new Date(sub.next_billing_date);
              const diff = Math.ceil(
                (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const urgentText =
                diff === 0 ? "오늘" : diff === 1 ? "내일" : `${diff}일 후`;

              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3.5 bg-bg-card rounded-[12px] p-4 border border-border pressable stagger-item"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                    style={{ backgroundColor: `${sub.color || cat.color}15` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-text-primary truncate">
                      {sub.name}
                    </p>
                    <p className="text-[12px] text-warning font-medium mt-0.5">
                      {urgentText} · {format(d, "M/d")}
                    </p>
                  </div>
                  <p className="font-bold text-[15px] text-text-primary tabular-nums shrink-0">
                    {sub.amount.toLocaleString()}원
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            최근 거래
          </h2>
          <Link
            href="/budget"
            className="text-accent text-[13px] font-medium flex items-center gap-0.5 pressable"
          >
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="bg-bg-card rounded-[12px] p-5 border border-border text-center">
            <p className="text-[13px] text-text-tertiary">
              이번 달 거래 내역이 없습니다
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {transactions.slice(0, 5).map((tx, i) => {
                const cat = getCategoryInfo(tx.category);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3.5 bg-bg-card rounded-[12px] p-4 border border-border stagger-item"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div
                      className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-text-primary truncate">
                        {tx.description}
                      </p>
                      <p className="text-[12px] text-text-tertiary mt-0.5">
                        {format(new Date(tx.date), "M월 d일")} · {cat.label}
                      </p>
                    </div>
                    <p
                      className={`font-bold text-[15px] tabular-nums shrink-0 ${
                        tx.type === "income"
                          ? "text-positive"
                          : "text-text-primary"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {tx.amount.toLocaleString()}원
                    </p>
                  </div>
                );
              })}
            </div>
            {transactions.length > 5 && (
              <Link
                href="/budget"
                className="block text-center text-[13px] text-accent font-medium mt-3 py-2 pressable"
              >
                {transactions.length - 5}건 더 보기
              </Link>
            )}
          </>
        )}
      </section>

      {/* Quick Links */}
      <div className="space-y-2.5">
        <Link
          href="/report"
          className="flex items-center justify-between bg-bg-card rounded-[12px] p-4 border border-border pressable"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Sparkles size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-[14px] text-text-primary">
                AI 소비 리포트
              </p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                이번 달 소비 분석 보기
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-tertiary" />
        </Link>

        <Link
          href="/simulator"
          className="flex items-center justify-between bg-bg-card rounded-[12px] p-4 border border-border pressable"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-accent-soft flex items-center justify-center">
              <CreditCard size={20} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold text-[14px] text-text-primary">
                절약 시뮬레이터
              </p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                구독 해지하면 얼마나 아낄 수 있을까?
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-tertiary" />
        </Link>

        <Link
          href="/goals"
          className="flex items-center justify-between bg-bg-card rounded-[12px] p-4 border border-border pressable"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-positive-soft flex items-center justify-center">
              <span className="text-[20px]">🎯</span>
            </div>
            <div>
              <p className="font-semibold text-[14px] text-text-primary">
                목표 저축
              </p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                저축 목표 & AI 챌린지
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-tertiary" />
        </Link>
      </div>

      {/* Notification Bottom Sheet */}
      <BottomSheet open={showNotiSheet} onClose={() => setShowNotiSheet(false)} title="알림">
        <div className="space-y-4">
          {!notiEnabled && (
            <button
              onClick={async () => {
                await enableNotifications();
              }}
              className="w-full flex items-center gap-3 p-4 bg-accent-soft rounded-[12px] border border-accent/20 pressable"
            >
              <Bell size={20} className="text-accent" />
              <div className="text-left flex-1">
                <p className="text-[14px] font-semibold text-accent">알림 켜기</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">결제일 리마인더를 받으려면 알림을 켜주세요</p>
              </div>
            </button>
          )}

          {/* Budget alerts */}
          {budgets.length > 0 && (
            <div>
              <h3 className="text-[13px] font-medium text-text-tertiary mb-2.5">
                예산 현황
              </h3>
              <div className="space-y-2">
                {budgets.map((b) => {
                  const spent = categoryExpenseMap.get(b.category) || 0;
                  const pct = Math.round((spent / b.limit_amount) * 100);
                  const catInfo = getCategoryInfo(b.category);
                  return (
                    <div key={b.id} className="p-3 bg-bg-primary rounded-[10px] border border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-medium text-text-primary">
                          {catInfo.icon} {catInfo.label}
                        </span>
                        <span className={`text-[11px] font-bold ${
                          pct >= 100 ? "text-negative" : pct >= 75 ? "text-warning" : "text-text-tertiary"
                        }`}>
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar percentage={pct} height={4} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming bills */}
          <div>
            <h3 className="text-[13px] font-medium text-text-tertiary mb-2.5">
              다가오는 결제 ({upcomingBills.length}건)
            </h3>
            {upcomingBills.length === 0 ? (
              <p className="text-[13px] text-text-tertiary text-center py-6">
                7일 내 예정된 결제가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingBills.map((sub) => {
                  const cat = getCategoryInfo(sub.category);
                  const d = new Date(sub.next_billing_date);
                  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const urgentText = diff === 0 ? "오늘" : diff === 1 ? "내일" : `${diff}일 후`;
                  return (
                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-bg-primary rounded-[10px] border border-border">
                      <span className="text-[18px]">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary truncate">{sub.name}</p>
                        <p className="text-[11px] text-warning font-medium">{urgentText} · {format(d, "M/d")}</p>
                      </div>
                      <p className="text-[13px] font-bold text-text-primary tabular-nums">
                        {sub.amount.toLocaleString()}원
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All subscriptions quick view */}
          {subscriptions.length > upcomingBills.length && (
            <div>
              <h3 className="text-[13px] font-medium text-text-tertiary mb-2.5">
                이후 결제 예정
              </h3>
              <div className="space-y-2">
                {subscriptions
                  .filter((s) => !upcomingBills.find((b) => b.id === s.id))
                  .slice(0, 5)
                  .map((sub) => {
                    const cat = getCategoryInfo(sub.category);
                    const d = new Date(sub.next_billing_date);
                    return (
                      <div key={sub.id} className="flex items-center gap-3 p-3 bg-bg-primary rounded-[10px] border border-border">
                        <span className="text-[18px]">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary truncate">{sub.name}</p>
                          <p className="text-[11px] text-text-tertiary">{format(d, "M월 d일")}</p>
                        </div>
                        <p className="text-[13px] font-bold text-text-primary tabular-nums">
                          {sub.amount.toLocaleString()}원
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {notiEnabled && (
            <p className="text-[11px] text-text-tertiary text-center">
              결제 1일 전, 당일에 알림을 보내드려요
            </p>
          )}
        </div>
      </BottomSheet>

    </div>
  );
}
