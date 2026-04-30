"use client";

import { useState } from "react";
import Subby from "@/components/Subby";

const ONBOARDING_KEY = "subsmart_onboarded";

const slides = [
  {
    bg: "#3182F615",
    accent: "#3182F6",
    visual: (
      <div className="w-[100px] h-[100px] rounded-[28px] bg-[#3182F615] flex items-center justify-center">
        <span className="text-[56px]">💳</span>
      </div>
    ),
    badge: "구독 관리",
    title: "내 구독,\n다 알고 있어요?",
    desc: "넷플릭스, 유튜브 프리미엄, 쿠팡 로켓와우...\n평균 5만원이 매달 자동으로 나가고 있어요.",
    highlight: "한 곳에서 전부 확인하세요",
  },
  {
    bg: "#F59E0B15",
    accent: "#F59E0B",
    visual: (
      <div className="w-[100px] h-[100px] rounded-[28px] bg-[#F59E0B15] flex items-center justify-center">
        <span className="text-[56px]">🔔</span>
      </div>
    ),
    badge: "결제일 알림",
    title: "결제일 깜빡하면\n그냥 날아가요",
    desc: "구독 결제일을 미리 알려드려요.\n취소 타이밍을 놓치지 마세요.",
    highlight: "3일 전 알림으로 미리 대비",
  },
  {
    bg: "#10B98115",
    accent: "#10B981",
    visual: (
      <div className="w-[100px] h-[100px] rounded-[28px] bg-[#10B98115] flex items-center justify-center">
        <Subby size={64} mood="thinking" />
      </div>
    ),
    badge: "AI 분석",
    title: "AI가 소비를\n코치해드려요",
    desc: "Gemini AI가 내 지출 패턴을 분석해\n맞춤 절약 팁을 제공해드려요.",
    highlight: "매달 소비 리포트 자동 생성",
  },
  {
    bg: "#8B5CF615",
    accent: "#8B5CF6",
    visual: (
      <div className="w-[100px] h-[100px] rounded-[28px] bg-[#8B5CF615] flex items-center justify-center">
        <Subby size={64} mood="happy" />
      </div>
    ),
    badge: "게이미피케이션",
    title: "써비와 함께\n돈 관리가 즐거워져요",
    desc: "지출을 기록할수록 XP를 모으고\n레벨이 올라가요. 매일 미션도 있어요!",
    highlight: "지금 바로 레벨 1 시작",
  },
];

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);

  function handleNext() {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      markOnboardingDone();
      onComplete();
    }
  }

  function handleSkip() {
    markOnboardingDone();
    onComplete();
  }

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-[60] bg-bg-primary flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6 shrink-0">
        <button onClick={handleSkip} className="text-[13px] text-text-tertiary pressable px-2 py-1">
          건너뛰기
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Visual */}
        <div
          key={`visual-${current}`}
          className="mb-8 animate-fade-in-up"
        >
          {slide.visual}
        </div>

        {/* Badge */}
        <div
          key={`badge-${current}`}
          className="animate-fade-in-up mb-3"
          style={{ animationDelay: "60ms" }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ color: slide.accent, backgroundColor: slide.bg }}
          >
            {slide.badge}
          </span>
        </div>

        {/* Title */}
        <h2
          key={`title-${current}`}
          className="text-[24px] font-bold text-text-primary leading-tight mb-3 whitespace-pre-line animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          {slide.title}
        </h2>

        {/* Desc */}
        <p
          key={`desc-${current}`}
          className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-line animate-fade-in-up"
          style={{ animationDelay: "140ms" }}
        >
          {slide.desc}
        </p>

        {/* Highlight */}
        <div
          key={`hl-${current}`}
          className="mt-5 px-4 py-2.5 rounded-[10px] animate-fade-in-up"
          style={{ backgroundColor: slide.bg, animationDelay: "180ms" }}
        >
          <p className="text-[13px] font-semibold" style={{ color: slide.accent }}>
            ✓ {slide.highlight}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-8 pb-10 shrink-0 space-y-5">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === current ? 28 : 8,
                backgroundColor: i === current ? slide.accent : "var(--color-border)",
              }}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          className="w-full py-[15px] font-bold text-[16px] rounded-[14px] pressable transition-colors text-white"
          style={{ backgroundColor: slide.accent }}
        >
          {current < slides.length - 1 ? "다음" : "시작하기 🚀"}
        </button>
      </div>
    </div>
  );
}
