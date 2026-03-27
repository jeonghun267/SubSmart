"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Subby from "@/components/Subby";

const ONBOARDING_KEY = "subsmart_onboarded";

const slides = [
  {
    emoji: "💳",
    title: "구독을 한눈에",
    desc: "넷플릭스, 유튜브 프리미엄 등\n모든 구독을 한 곳에서 관리하세요",
    color: "#3182F6",
  },
  {
    emoji: "📊",
    title: "스마트 가계부",
    desc: "수입과 지출을 기록하고\n카테고리별 예산을 설정하세요",
    color: "#10B981",
  },
  {
    emoji: "✨",
    title: "AI가 분석해드려요",
    desc: "Gemini AI가 소비 패턴을 분석해\n맞춤 절약 팁을 알려드려요",
    color: "#F59E0B",
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
    <div className="fixed inset-0 z-[60] bg-bg-primary flex flex-col items-center justify-between px-8 py-16 animate-fade-in-up">
      {/* Skip */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleSkip}
          className="text-[13px] text-text-tertiary pressable"
        >
          건너뛰기
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-8 transition-all duration-300"
          style={{ backgroundColor: `${slide.color}15` }}
        >
          {current === 2 ? (
            <Subby size={64} mood="thinking" />
          ) : (
            <span className="text-[48px]">{slide.emoji}</span>
          )}
        </div>
        <h2 className="text-[24px] font-bold text-text-primary mb-3">
          {slide.title}
        </h2>
        <p className="text-[15px] text-text-secondary leading-relaxed whitespace-pre-line">
          {slide.desc}
        </p>
      </div>

      {/* Bottom */}
      <div className="w-full space-y-5">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                backgroundColor: i === current ? slide.color : "var(--color-border)",
              }}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover transition-colors flex items-center justify-center gap-1"
        >
          {current < slides.length - 1 ? (
            <>다음 <ChevronRight size={16} /></>
          ) : (
            "시작하기"
          )}
        </button>
      </div>
    </div>
  );
}
