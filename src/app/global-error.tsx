"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <span className="text-[56px] mb-4">😢</span>
          <h1 className="text-[22px] font-bold text-text-primary mb-2">
            문제가 발생했어요
          </h1>
          <p className="text-[14px] text-text-secondary mb-8 max-w-[300px] leading-relaxed">
            예상치 못한 오류가 발생했어요.
            <br />
            페이지를 새로고침해 주세요.
          </p>

          <button
            onClick={reset}
            className="w-full max-w-[280px] py-[14px] bg-accent text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
