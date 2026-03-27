"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center bg-warning text-white text-[13px] font-semibold transition-all duration-300 ease-in-out ${
        isOnline
          ? "translate-y-[-100%] opacity-0 h-0"
          : "translate-y-0 opacity-100 py-2.5"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="w-4 h-4 mr-1.5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072M12 12h.01"
        />
      </svg>
      인터넷에 연결되어 있지 않아요
    </div>
  );
}
