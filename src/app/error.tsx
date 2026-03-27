"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6 text-center">
      <span className="text-[56px] mb-4">😢</span>
      <h1 className="text-[22px] font-bold text-text-primary mb-2">
        문제가 발생했어요
      </h1>
      <p className="text-[14px] text-text-secondary mb-8 max-w-[300px] leading-relaxed">
        일시적인 오류가 발생했어요.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <button
          onClick={reset}
          className="w-full py-[14px] bg-accent text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover transition-colors"
        >
          다시 시도
        </button>
        <Link
          href="/dashboard"
          className="w-full py-[14px] bg-bg-card text-text-secondary font-medium text-[15px] rounded-[12px] border border-border text-center pressable hover:bg-bg-elevated transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
