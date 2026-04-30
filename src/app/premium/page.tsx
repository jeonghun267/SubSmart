"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, Sparkles, Target, Calculator, ChevronLeft, X } from "lucide-react";
import Subby from "@/components/Subby";
import { isPremium } from "@/lib/premium";

const FREE_FEATURES = [
  "구독 관리 (무제한)",
  "가계부 기록 (무제한)",
  "AI 분석 리포트 (월 3회)",
  "결제일 알림",
  "써비 게이미피케이션",
];

const PREMIUM_FEATURES = [
  { icon: Sparkles, text: "AI 분석 리포트 무제한" },
  { icon: Target, text: "저축 목표 관리" },
  { icon: Calculator, text: "구독 절약 시뮬레이터" },
  { icon: Crown, text: "AI 도전과제 맞춤 제안" },
];

const PLANS = [
  {
    id: "monthly",
    label: "월간",
    price: 3900,
    unit: "월",
    badge: null,
    orderId: "subsmart-monthly",
    orderName: "SubSmart 프리미엄 월간",
  },
  {
    id: "yearly",
    label: "연간",
    price: 29900,
    unit: "년",
    badge: "36% 할인",
    monthlyEquiv: 2492,
    orderId: "subsmart-yearly",
    orderName: "SubSmart 프리미엄 연간",
  },
] as const;

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  if (isPremium()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg-primary">
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Crown size={40} className="text-amber-500" />
          </div>
          <h1 className="text-[22px] font-bold text-text-primary mb-2">이미 프리미엄이에요!</h1>
          <p className="text-[14px] text-text-secondary mb-8">모든 기능을 자유롭게 사용하세요</p>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-accent text-white font-semibold rounded-[12px] pressable"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  async function handlePayment() {
    const plan = PLANS.find((p) => p.id === selectedPlan)!;
    setLoading(true);

    try {
      // TODO: Toss Payments 클라이언트 키를 .env.local의 NEXT_PUBLIC_TOSS_CLIENT_KEY에 설정 후 아래 주석 해제
      // const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      // const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      // const payment = tossPayments.payment({ customerKey: `subsmart-${Date.now()}` });
      // await payment.requestPayment({
      //   method: "CARD",
      //   amount: { currency: "KRW", value: plan.price },
      //   orderId: `${plan.orderId}-${Date.now()}`,
      //   orderName: plan.orderName,
      //   successUrl: `${window.location.origin}/api/toss/payment-confirm?plan=${plan.id}`,
      //   failUrl: `${window.location.origin}/premium?fail=1`,
      // });

      // 결제 키 미설정 시 안내
      alert(`결제 시스템 연동 준비 중이에요.\n\n선택하신 플랜: ${plan.orderName}\n금액: ${plan.price.toLocaleString()}원/${plan.unit}\n\n.env.local에 NEXT_PUBLIC_TOSS_CLIENT_KEY를 설정해주세요.`);
    } catch (err) {
      console.error("결제 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="p-2 pressable rounded-[10px]">
          <ChevronLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[18px] font-bold text-text-primary flex-1">프리미엄</h1>
      </div>

      <div className="px-5 space-y-6 pb-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[20px] p-6 text-center relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <Subby size={72} mood="happy" />
            </div>
            <h2 className="text-[22px] font-bold text-white mb-1">SubSmart 프리미엄</h2>
            <p className="text-white/80 text-[14px]">AI 무제한으로 돈 관리의 달인이 되어보세요</p>
          </div>
        </div>

        {/* Premium Features */}
        <div className="bg-bg-card rounded-[16px] p-5 border border-border">
          <h3 className="text-[15px] font-bold text-text-primary mb-4 flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            프리미엄 전용 기능
          </h3>
          <div className="space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-[8px] flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-amber-500" />
                </div>
                <p className="text-[14px] font-medium text-text-primary">{text}</p>
                <Check size={16} className="text-amber-500 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Free vs Premium Compare */}
        <div className="bg-bg-card rounded-[16px] border border-border overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-border">
              <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-3">무료</p>
              <div className="space-y-2">
                {FREE_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={13} className="text-positive mt-0.5 shrink-0" />
                    <p className="text-[12px] text-text-secondary">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10">
              <p className="text-[12px] font-bold text-amber-600 uppercase tracking-wider mb-3">프리미엄</p>
              <div className="space-y-2">
                {FREE_FEATURES.map((f, i) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-amber-700 dark:text-amber-400">
                      {i === 2 ? "AI 분석 리포트 무제한" : f}
                    </p>
                  </div>
                ))}
                {PREMIUM_FEATURES.map(({ text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Check size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-amber-700 dark:text-amber-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selector */}
        <div>
          <h3 className="text-[15px] font-bold text-text-primary mb-3">플랜 선택</h3>
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[14px] border-2 transition-all pressable text-left ${
                  selectedPlan === plan.id
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
                    : "border-border bg-bg-card"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedPlan === plan.id ? "border-amber-400" : "border-border"
                }`}>
                  {selectedPlan === plan.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-text-primary">{plan.label}</p>
                    {plan.badge && (
                      <span className="text-[10px] font-bold text-white bg-amber-400 px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  {"monthlyEquiv" in plan && (
                    <p className="text-[12px] text-text-tertiary mt-0.5">
                      월 {plan.monthlyEquiv.toLocaleString()}원 상당
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[18px] font-bold text-text-primary tabular-nums">
                    {plan.price.toLocaleString()}
                    <span className="text-[13px] font-normal text-text-tertiary">원/{plan.unit}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-[16px] bg-amber-400 hover:bg-amber-500 text-white font-bold text-[16px] rounded-[14px] pressable transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Crown size={18} />
          {loading ? "처리 중..." : "프리미엄 시작하기"}
        </button>

        <p className="text-center text-[11px] text-text-tertiary">
          결제 후 즉시 모든 기능이 활성화돼요 · 언제든 취소 가능
        </p>
      </div>
    </div>
  );
}
