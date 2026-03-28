"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Subscription, CATEGORIES, getCategoryInfo } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Crown, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedNumber from "@/components/AnimatedNumber";
import Subby from "@/components/Subby";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";
import { DashboardSkeleton } from "@/components/Skeleton";
import { isPremium } from "@/lib/premium";

export default function SimulatorPage() {
  const { user: authUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authUser) loadSubs();
  }, [authUser]);

  async function loadSubs() {
    if (!authUser) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("is_active", true)
      .order("amount", { ascending: false });
    setSubscriptions(data || []);
    setLoading(false);
  }

  function getMonthly(sub: Subscription) {
    if (sub.billing_cycle === "yearly") return sub.amount / 12;
    if (sub.billing_cycle === "weekly") return sub.amount * 4;
    return sub.amount;
  }

  const getCat = getCategoryInfo;

  const totalMonthly = subscriptions.reduce((s, sub) => s + getMonthly(sub), 0);
  const cancelledMonthly = subscriptions
    .filter(s => toggled.has(s.id))
    .reduce((s, sub) => s + getMonthly(sub), 0);
  const afterMonthly = totalMonthly - cancelledMonthly;
  const yearlySaved = Math.round(cancelledMonthly * 12);

  // Fun Korean equivalents
  const chicken = Math.floor(yearlySaved / 20000);
  const starbucks = Math.floor(yearlySaved / 5500);
  const jeju = Math.floor(yearlySaved / 150000);

  function toggleSub(id: string) {
    setToggled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 pressable">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary">절약 시뮬레이터</h1>
            <p className="text-[12px] text-text-tertiary">해지하면 얼마나 아낄 수 있을까?</p>
          </div>
        </div>
        {/* TODO: 프리미엄 결제 연동 후 PRO 뱃지 활성화 */}
      </div>

      {/* Savings Summary */}
      <div className={`rounded-[16px] p-6 text-center relative overflow-hidden ${
        toggled.size > 0 ? "bg-positive" : "bg-accent"
      }`}>
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <p className="text-white/70 text-[13px]">
          {toggled.size > 0 ? "연간 절약 가능 금액" : "현재 월 구독료"}
        </p>
        <div className="mt-1">
          <AnimatedNumber
            value={toggled.size > 0 ? yearlySaved : Math.round(totalMonthly)}
            suffix="원"
            className="text-[34px] font-bold text-white"
          />
        </div>
        {toggled.size > 0 && (
          <p className="text-white/80 text-[13px] mt-2">
            월 {Math.round(afterMonthly).toLocaleString()}원으로 줄어요
          </p>
        )}
      </div>

      {/* Fun equivalents */}
      {toggled.size > 0 && yearlySaved > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {chicken > 0 && (
            <div className="bg-bg-card rounded-[12px] p-3 border border-border text-center">
              <p className="text-[24px]">🍗</p>
              <p className="text-[16px] font-bold text-text-primary mt-1">{chicken}마리</p>
              <p className="text-[10px] text-text-tertiary">치킨</p>
            </div>
          )}
          {starbucks > 0 && (
            <div className="bg-bg-card rounded-[12px] p-3 border border-border text-center">
              <p className="text-[24px]">☕</p>
              <p className="text-[16px] font-bold text-text-primary mt-1">{starbucks}잔</p>
              <p className="text-[10px] text-text-tertiary">아메리카노</p>
            </div>
          )}
          {jeju > 0 && (
            <div className="bg-bg-card rounded-[12px] p-3 border border-border text-center">
              <p className="text-[24px]">✈️</p>
              <p className="text-[16px] font-bold text-text-primary mt-1">{jeju}번</p>
              <p className="text-[10px] text-text-tertiary">제주 여행</p>
            </div>
          )}
        </div>
      )}

      {/* Subscription toggles */}
      <div>
        <h3 className="text-[14px] font-semibold text-text-primary mb-3">
          해지할 구독을 선택하세요
        </h3>
        <div className="space-y-2.5">
          {subscriptions.map((sub) => {
            const cat = getCat(sub.category);
            const monthly = Math.round(getMonthly(sub));
            const isOff = toggled.has(sub.id);

            return (
              <button
                key={sub.id}
                onClick={() => toggleSub(sub.id)}
                className={`w-full flex items-center gap-3.5 rounded-[12px] p-4 border transition-all pressable text-left ${
                  isOff
                    ? "bg-negative-soft border-negative/20"
                    : "bg-bg-card border-border"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] shrink-0 ${
                    isOff ? "opacity-40" : ""
                  }`}
                  style={{ backgroundColor: `${sub.color || cat.color}15` }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[14px] truncate ${
                    isOff ? "line-through text-text-tertiary" : "text-text-primary"
                  }`}>
                    {sub.name}
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    {sub.billing_cycle === "monthly" ? "월간" : sub.billing_cycle === "yearly" ? "연간" : "주간"}
                    {isOff && ` · 연 ${(monthly * 12).toLocaleString()}원 절약`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-[15px] tabular-nums ${
                    isOff ? "line-through text-text-tertiary" : "text-text-primary"
                  }`}>
                    {monthly.toLocaleString()}원
                    <span className="text-[11px] font-normal text-text-tertiary">/월</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-16">
          <Subby size={64} mood="happy" className="mx-auto mb-3" />
          <p className="text-[14px] text-text-secondary">활성 구독이 없어요</p>
          <Link href="/subscriptions" className="text-accent text-[13px] font-medium mt-2 inline-block pressable">
            구독 추가하기
          </Link>
        </div>
      )}

      {toggled.size > 0 && (
        <div className="space-y-3">
          <div className="bg-accent-soft rounded-[12px] p-4 flex items-center gap-3">
            <Subby size={36} mood="wink" className="shrink-0" />
            <p className="text-[13px] text-accent font-medium">
              {toggled.size}개 구독을 해지하면 연간 {yearlySaved.toLocaleString()}원을 아낄 수 있어요!
            </p>
          </div>

          {/* 목표 저축 연계 CTA */}
          <Link
            href={`/goals?suggest=${yearlySaved}`}
            className="w-full flex items-center justify-center gap-2 py-[14px] bg-positive text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-positive/90 transition-colors"
          >
            <Target size={18} />
            이 금액으로 저축 목표 만들기
          </Link>

          <button
            onClick={() => setShowPauseConfirm(true)}
            className="w-full py-[14px] bg-negative text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-negative/90 transition-colors"
          >
            선택한 {toggled.size}개 구독 일시정지
          </button>

          <ConfirmDialog
            open={showPauseConfirm}
            title="구독 일시정지"
            message={`선택한 ${toggled.size}개 구독을 일시정지할까요? 구독 목록에서 다시 활성화할 수 있어요.`}
            confirmText="일시정지"
            cancelText="취소"
            variant="danger"
            onConfirm={async () => {
              setShowPauseConfirm(false);
              const ids = Array.from(toggled);
              await Promise.all(
                ids.map(id =>
                  supabase.from("subscriptions").update({ is_active: false }).eq("id", id)
                )
              );
              showToast(`${ids.length}개 구독이 일시정지되었어요`, "success");
              setToggled(new Set());
              loadSubs();
            }}
            onCancel={() => setShowPauseConfirm(false)}
          />
        </div>
      )}
    </div>
  );
}
