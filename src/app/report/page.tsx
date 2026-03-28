"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Crown, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Subby from "@/components/Subby";
import DonutChart from "@/components/DonutChart";
import { CATEGORIES, getCategoryInfo } from "@/lib/types";
import { isPremium } from "@/lib/premium";
import { DashboardSkeleton } from "@/components/Skeleton";
import { authFetch } from "@/lib/api";

interface Report {
  personality: string;
  personality_emoji: string;
  month_change_percent: number;
  month_summary: string;
  top_category: string;
  savings_tips: string[];
  subscription_alert: string;
  score: number;
  one_line: string;
}

export default function ReportPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [curMonth] = useState(format(new Date(), "yyyy-MM"));
  const [categoryData, setCategoryData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (authUser) loadReport();
  }, [authUser]);

  async function loadReport() {
    setLoading(true);
    // Check for cached report
    const cached = localStorage.getItem(`subsmart_report_${curMonth}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setReport(parsed.report);
        setCategoryData(parsed.categoryData || []);
        setTotalExpense(parsed.totalExpense || 0);
        setLoading(false);
        return;
      } catch { /* ignore */ }
    }
    await generateReport();
  }

  async function generateReport() {
    setGenerating(true);
    setError("");

    try {
      if (!authUser) return;

      const now = new Date();
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonth = format(prevDate, "yyyy-MM");

      // Fetch 2 months of data
      const twoMonthsAgo = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "yyyy-MM-dd");
      const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");

      const [subsRes, txRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", authUser.id),
        supabase.from("transactions").select("*").eq("user_id", authUser.id)
          .gte("date", twoMonthsAgo).lte("date", monthEnd),
      ]);

      // Build category data for chart
      const catMap = new Map<string, number>();
      (txRes.data || [])
        .filter((t: { type: string; date: string }) => t.type === "expense" && t.date.startsWith(curMonth))
        .forEach((t: { category: string; amount: number }) => {
          catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
        });

      const catData = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat, val]) => ({
          label: getCategoryInfo(cat).label,
          value: val,
          color: getCategoryInfo(cat).color,
        }));

      const total = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
      setCategoryData(catData);
      setTotalExpense(total);

      const res = await authFetch("/api/ai-report", {
        method: "POST",
        body: JSON.stringify({
          subscriptions: subsRes.data,
          transactions: txRes.data,
          currentMonth: curMonth,
          previousMonth,
        }),
      });

      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        setReport(result.report);
        // Cache
        localStorage.setItem(`subsmart_report_${curMonth}`, JSON.stringify({
          report: result.report,
          categoryData: catData,
          totalExpense: total,
        }));
      }
    } catch {
      setError("리포트 생성에 실패했어요.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  const scoreColor = (report?.score ?? 0) >= 70 ? "#10B981" : (report?.score ?? 0) >= 40 ? "#F59E0B" : "#EF4444";
  const changeIcon = (report?.month_change_percent ?? 0) > 0
    ? <TrendingUp size={14} className="text-negative" />
    : (report?.month_change_percent ?? 0) < 0
    ? <TrendingDown size={14} className="text-positive" />
    : <Minus size={14} className="text-text-tertiary" />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 pressable">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary">AI 소비 리포트</h1>
            <p className="text-[12px] text-text-tertiary">{format(new Date(), "yyyy년 M월", { locale: ko })}</p>
          </div>
        </div>
        {/* TODO: 프리미엄 결제 연동 후 PRO 뱃지 활성화 */}
      </div>

      {!report && error && (
        <div className="text-center py-16">
          <Subby size={64} mood="worried" className="mx-auto mb-4" />
          <p className="text-[14px] text-text-secondary mb-4">{error}</p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-6 py-3 bg-accent text-text-inverse font-semibold text-[14px] rounded-[10px] pressable"
          >
            {generating ? "생성 중..." : "다시 시도"}
          </button>
        </div>
      )}

      {generating && !report && (
        <div className="text-center py-16">
          <Subby size={64} mood="thinking" className="mx-auto mb-4 animate-bounce" />
          <p className="text-[14px] font-medium text-text-primary">써비가 리포트를 만들고 있어요</p>
          <p className="text-[12px] text-text-tertiary mt-1">잠시만 기다려주세요...</p>
        </div>
      )}

      {report && (
        <>
          {/* Personality Card */}
          <div className="bg-accent rounded-[16px] p-6 text-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
            <p className="text-[40px] mb-2 relative z-10">{report.personality_emoji}</p>
            <h2 className="text-[22px] font-bold text-white relative z-10">{report.personality}</h2>
            <p className="text-white/70 text-[13px] mt-1 relative z-10">{report.month_summary}</p>
          </div>

          {/* Score + Month Change */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-card rounded-[14px] p-4 border border-border text-center">
              <p className="text-[11px] text-text-tertiary mb-2">소비 건전성</p>
              <p className="text-[32px] font-bold" style={{ color: scoreColor }}>{report.score}</p>
              <p className="text-[11px] text-text-tertiary">/ 100점</p>
            </div>
            <div className="bg-bg-card rounded-[14px] p-4 border border-border text-center">
              <p className="text-[11px] text-text-tertiary mb-2">지난 달 대비</p>
              <div className="flex items-center justify-center gap-1">
                {changeIcon}
                <p className={`text-[28px] font-bold ${
                  report.month_change_percent > 0 ? "text-negative" :
                  report.month_change_percent < 0 ? "text-positive" : "text-text-primary"
                }`}>
                  {report.month_change_percent > 0 ? "+" : ""}{report.month_change_percent}%
                </p>
              </div>
              <p className="text-[11px] text-text-tertiary">
                {report.month_change_percent > 0 ? "더 많이 썼어요" :
                 report.month_change_percent < 0 ? "절약했어요!" : "비슷해요"}
              </p>
            </div>
          </div>

          {/* Category Chart */}
          {categoryData.length > 0 && (
            <div className="bg-bg-card rounded-[14px] p-5 border border-border">
              <h3 className="text-[14px] font-semibold text-text-primary mb-4">카테고리별 지출</h3>
              <div className="flex items-center gap-5">
                <DonutChart
                  segments={categoryData}
                  size={120}
                  thickness={20}
                  centerLabel="총 지출"
                  centerValue={`${Math.round(totalExpense / 10000)}만`}
                />
                <div className="flex-1 space-y-2">
                  {categoryData.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[11px] text-text-secondary flex-1 truncate">{seg.label}</span>
                      <span className="text-[11px] font-semibold text-text-primary tabular-nums">
                        {seg.value.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Savings Tips */}
          <div className="bg-bg-card rounded-[14px] p-5 border border-border">
            <h3 className="text-[14px] font-semibold text-text-primary mb-3">절약 포인트</h3>
            <div className="space-y-2.5">
              {report.savings_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[12px] w-5 h-5 bg-accent-soft text-accent font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-text-secondary leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Alert */}
          <div className="bg-bg-card rounded-[14px] p-4 border border-border flex items-center gap-3">
            <Subby size={36} mood="wink" className="shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-text-primary">구독 진단</p>
              <p className="text-[12px] text-text-secondary mt-0.5">{report.subscription_alert}</p>
            </div>
          </div>

          {/* One Line */}
          <div className="bg-accent-soft rounded-[12px] p-4 text-center">
            <p className="text-[14px] font-semibold text-accent">{report.one_line}</p>
          </div>

          {/* Page connections */}
          <div className="space-y-2.5">
            <Link
              href="/simulator"
              className="flex items-center justify-between bg-bg-card rounded-[12px] p-4 border border-border pressable"
            >
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🧮</span>
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">절약 시뮬레이터</p>
                  <p className="text-[11px] text-text-tertiary">구독 해지하면 얼마나 아낄까?</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </Link>
            <Link
              href="/goals"
              className="flex items-center justify-between bg-bg-card rounded-[12px] p-4 border border-border pressable"
            >
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🎯</span>
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">저축 목표 설정</p>
                  <p className="text-[11px] text-text-tertiary">절약한 금액으로 목표를 세워보세요</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </Link>
          </div>

          {/* Regenerate */}
          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 text-[13px] text-text-tertiary pressable"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            {generating ? "생성 중..." : "리포트 다시 생성"}
          </button>
        </>
      )}
    </div>
  );
}
