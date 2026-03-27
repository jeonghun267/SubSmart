"use client";

interface ProgressBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
  spent?: number;
  limit?: number;
}

export default function ProgressBar({
  percentage,
  height = 8,
  showLabel = false,
  spent,
  limit,
}: ProgressBarProps) {
  const color =
    percentage >= 100
      ? "var(--negative)"
      : percentage >= 75
      ? "var(--warning)"
      : "var(--accent)";

  const bgColor =
    percentage >= 100
      ? "var(--negative-soft)"
      : percentage >= 75
      ? "var(--warning-soft)"
      : "var(--accent-soft)";

  return (
    <div>
      {showLabel && spent !== undefined && limit !== undefined && (
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="text-text-secondary tabular-nums">
            {spent.toLocaleString()}원
          </span>
          <span className="text-text-tertiary tabular-nums">
            {limit.toLocaleString()}원
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: bgColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
