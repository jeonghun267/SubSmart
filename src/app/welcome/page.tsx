"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Subby from "@/components/Subby";

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1600),
      setTimeout(() => setStep(4), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-bg-primary">
      <div className="w-full max-w-sm text-center">

        {/* 써비 캐릭터 */}
        <div
          className="mb-7 flex justify-center transition-all duration-700"
          style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.8)" }}
        >
          <Subby size={96} mood="happy" />
        </div>

        {/* 공감 훅 */}
        <div
          className="transition-all duration-500"
          style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(14px)" }}
        >
          <p className="text-[12px] font-semibold text-accent uppercase tracking-widest mb-3">
            혹시 알고 계셨나요?
          </p>
          <h1 className="text-[26px] font-bold text-text-primary leading-tight">
            매달 구독료로<br />
            <span className="text-accent">평균 5만원 이상</span> 빠져나가요
          </h1>
        </div>

        {/* 설명 */}
        <p
          className="text-[14px] text-text-secondary leading-relaxed mt-4 transition-all duration-500"
          style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(14px)" }}
        >
          자신도 모르게 새는 구독료,<br />
          써비가 깔끔하게 정리해드릴게요
        </p>

        {/* 핵심 기능 3개 */}
        <div
          className="mt-6 space-y-2.5 transition-all duration-500"
          style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(14px)" }}
        >
          {[
            { emoji: "💳", title: "구독 한눈에 관리", desc: "결제일 전에 미리 알려드려요" },
            { emoji: "🤖", title: "AI 소비 분석", desc: "맞춤 절약 팁을 자동으로 제공해요" },
            { emoji: "🎯", title: "가계부 + 저축 목표", desc: "쓰고 모으는 습관을 함께 만들어요" },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3.5 bg-bg-card rounded-[14px] px-4 py-3.5 border border-border text-left"
            >
              <span className="text-[22px] shrink-0">{emoji}</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{title}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.replace("/dashboard")}
          disabled={step < 4}
          className="w-full mt-8 py-[15px] bg-accent text-white font-bold text-[16px] rounded-[14px] pressable hover:bg-accent-hover transition-all disabled:opacity-0"
          style={{ opacity: step >= 4 ? 1 : 0, transform: step >= 4 ? "translateY(0)" : "translateY(14px)" }}
        >
          써비와 시작하기 🚀
        </button>

      </div>
    </div>
  );
}
