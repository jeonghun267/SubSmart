"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Subby from "@/components/Subby";

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-bg-primary">
      <div className="text-center animate-fade-in-up">
        {/* Subby 캐릭터 */}
        <div className="mb-6">
          <Subby size={96} mood="happy" />
        </div>

        {/* 환영 메시지 - 순차 등장 */}
        <div className="space-y-3">
          <h1
            className="text-[28px] font-bold text-text-primary transition-all duration-500"
            style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(10px)" }}
          >
            환영합니다!
          </h1>

          <p
            className="text-[16px] text-text-secondary leading-relaxed transition-all duration-500"
            style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(10px)" }}
          >
            이제 써비와 함께<br />
            똑똑한 돈 관리를 시작해볼까요?
          </p>

          <div
            className="pt-4 space-y-2.5 transition-all duration-500"
            style={{ opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(10px)" }}
          >
            {/* 핵심 기능 안내 */}
            <div className="flex items-center gap-3 bg-bg-card rounded-[12px] p-3.5 border border-border text-left">
              <span className="text-[22px]">💳</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">구독 한눈에 관리</p>
                <p className="text-[11px] text-text-tertiary">넷플릭스, 유튜브 등 모든 구독을 한 곳에서</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-card rounded-[12px] p-3.5 border border-border text-left">
              <span className="text-[22px]">📊</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">AI 소비 분석</p>
                <p className="text-[11px] text-text-tertiary">지출 패턴을 분석하고 절약 팁을 알려줘요</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-card rounded-[12px] p-3.5 border border-border text-left">
              <span className="text-[22px]">🎯</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">목표 저축</p>
                <p className="text-[11px] text-text-tertiary">여행, 전자기기 등 목표를 세우고 모아봐요</p>
              </div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <button
          onClick={() => router.replace("/dashboard")}
          className="w-full mt-8 py-[14px] bg-accent text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover transition-all"
          style={{ opacity: step >= 3 ? 1 : 0 }}
        >
          시작하기
        </button>

        <p
          className="text-[11px] text-text-tertiary mt-4 transition-all duration-500"
          style={{ opacity: step >= 3 ? 1 : 0 }}
        >
          가입과 동시에 개인정보 처리방침에 동의합니다
        </p>
      </div>
    </div>
  );
}
