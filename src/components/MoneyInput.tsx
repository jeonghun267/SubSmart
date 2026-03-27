"use client";

import { useRef, useEffect } from "react";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  suffix?: string;
}

function formatWithCommas(n: number): string {
  if (n === 0) return "";
  return n.toLocaleString("ko-KR");
}

export default function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  suffix = "원",
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value > 0 ? formatWithCommas(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    if (!isNaN(num) && num <= 999999999) {
      onChange(num);
    }
  }

  // 한글 변환 (1만, 10만, 100만 등)
  function getKoreanAmount(n: number): string {
    if (n === 0) return "";
    if (n >= 100000000) return `${(n / 100000000).toFixed(n % 100000000 === 0 ? 0 : 1)}억`;
    if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}천`;
    return `${n}`;
  }

  const koreanHint = value >= 10000 ? getKoreanAmount(value) + suffix : "";

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pr-8 ${className}`}
        />
        {value > 0 && (
          <span className="absolute right-3 text-text-tertiary text-[14px] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {koreanHint && (
        <p className="text-[11px] text-accent mt-1 ml-1">{koreanHint}</p>
      )}
    </div>
  );
}
