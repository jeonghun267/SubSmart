"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Subby from "@/components/Subby";
import {
  LEVEL_TABLE,
  getSubbyXp,
  getSubbyLevel,
  getSubbyLevelInfo,
  getXpToNextLevel,
} from "@/lib/subby-level";
import { getStats, type SubbyStats } from "@/lib/subby-stats";

const SPEECH_BUBBLES = [
  "오늘도 알뜰하게 지출했네! 대단해!",
  "기록하는 습관이 부자의 첫걸음이야!",
  "꾸준히 예산을 지키고 있어서 뿌듯해~",
  "작은 절약이 모이면 큰 자산이 돼!",
  "오늘 지출 기록 잊지 말자!",
  "매일 기록하면 내가 더 빛나!",
  "예산 안에서 잘 지내고 있지?",
];

function getRandomBubble() {
  return SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)];
}

// Level-based gradient backgrounds
function getLevelGradient(level: number): string {
  if (level >= 7) return "from-violet-500/20 via-blue-500/20 to-emerald-500/20";
  if (level >= 6) return "from-blue-500/20 to-cyan-500/20";
  if (level >= 5) return "from-amber-500/20 to-yellow-500/20";
  if (level >= 4) return "from-yellow-400/15 to-amber-400/15";
  if (level >= 3) return "from-yellow-300/15 to-orange-300/10";
  if (level >= 2) return "from-yellow-200/10 to-amber-200/10";
  return "from-gray-200/10 to-gray-300/10";
}

export default function SubbyHomePage() {
  const router = useRouter();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [stats, setStats] = useState<SubbyStats | null>(null);
  const [bubble, setBubble] = useState("");

  useEffect(() => {
    try {
      const currentXp = getSubbyXp();
      setXp(currentXp);
      setLevel(getSubbyLevel(currentXp));
      setStats(getStats());
      setBubble(getRandomBubble());
    } catch (e) {
      console.error("SubbyHome init error:", e);
    }
  }, []);

  const levelInfo = getSubbyLevelInfo(level);
  const xpProgress = getXpToNextLevel(xp);

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-md px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-text-secondary pressable"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[15px]">뒤로</span>
        </button>
      </div>

      {/* Hero: Large Subby with gradient background */}
      <div className="px-6 pt-2 pb-6 animate-fade-in-up">
        <div
          className={`relative mx-auto w-full max-w-[280px] aspect-square rounded-[24px] bg-gradient-to-br ${getLevelGradient(level)} flex items-center justify-center`}
        >
          <Subby size={160} mood="happy" level={level} />

          {/* Floating level badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg-card rounded-full px-4 py-1.5 shadow-md">
            <span className="text-[13px] font-semibold text-accent">
              Lv.{level}
            </span>
          </div>
        </div>
      </div>

      {/* Level info + XP progress */}
      <div className="px-6 mb-5 animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <div className="bg-bg-card rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[18px] font-bold text-text-primary">
                Lv.{level} {levelInfo.name}
              </h2>
              <p className="text-[13px] text-text-secondary mt-0.5">
                {levelInfo.desc}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[13px] text-text-tertiary">
                {xpProgress.current} / {xpProgress.needed} XP
              </span>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${xpProgress.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Speech bubble */}
      <div className="px-6 mb-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="relative bg-bg-card rounded-[16px] p-4 shadow-sm">
          {/* Bubble tail */}
          <div className="absolute -top-2 left-8 w-4 h-4 bg-bg-card rotate-45" />
          <p className="text-[14px] text-text-primary leading-relaxed relative z-10">
            &ldquo;{bubble}&rdquo;
          </p>
        </div>
      </div>

      {/* Evolution catalog */}
      <div className="px-6 mb-5 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <h3 className="text-[16px] font-bold text-text-primary mb-3">
          진화 도감
        </h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {LEVEL_TABLE.map((entry) => {
            const isUnlocked = level >= entry.level;
            return (
              <div
                key={entry.level}
                className={`flex-shrink-0 w-[100px] rounded-[14px] p-3 flex flex-col items-center gap-2 ${
                  isUnlocked
                    ? "bg-bg-card shadow-sm"
                    : "bg-bg-primary border border-border"
                }`}
              >
                <div className={isUnlocked ? "" : "opacity-20 grayscale"}>
                  <Subby size={48} mood="happy" level={entry.level} />
                </div>
                <div className="text-center">
                  <p
                    className={`text-[11px] font-semibold ${
                      isUnlocked ? "text-text-primary" : "text-text-tertiary"
                    }`}
                  >
                    Lv.{entry.level}
                  </p>
                  <p
                    className={`text-[10px] ${
                      isUnlocked ? "text-text-secondary" : "text-text-tertiary"
                    }`}
                  >
                    {isUnlocked ? entry.name : "???"}
                  </p>
                </div>
                {entry.level === level && (
                  <span className="text-[9px] bg-accent text-text-inverse px-2 py-0.5 rounded-full font-medium">
                    현재
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats section */}
      <div className="px-6 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <h3 className="text-[16px] font-bold text-text-primary mb-3">
          나의 성장 기록
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="총 경험치"
            value={stats?.totalXp ?? 0}
            unit="XP"
          />
          <StatCard
            label="퀘스트 완료"
            value={stats?.questsCompleted ?? 0}
            unit="회"
          />
          <StatCard
            label="최장 연속 접속"
            value={stats?.longestStreak ?? 0}
            unit="일"
          />
          <StatCard
            label="올클리어"
            value={stats?.allClearCount ?? 0}
            unit="회"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="bg-bg-card rounded-[14px] p-4 shadow-sm">
      <p className="text-[12px] text-text-secondary mb-1">{label}</p>
      <p className="text-[20px] font-bold text-text-primary tabular-nums">
        {value.toLocaleString()}
        <span className="text-[13px] font-normal text-text-tertiary ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}
