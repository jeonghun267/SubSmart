"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  segments,
  size = 180,
  thickness = 24,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full border-[3px] border-border flex items-center justify-center"
          style={{ width: size - 20, height: size - 20 }}
        >
          <span className="text-text-tertiary text-sm">데이터 없음</span>
        </div>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          const segmentLength = (seg.value / total) * circumference;
          const gap = segments.length > 1 ? 3 : 0;
          const offset = cumulativeOffset;
          cumulativeOffset += segmentLength;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(segmentLength - gap, 0)} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            />
          );
        })}
      </svg>
      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && (
            <span className="text-[11px] text-text-tertiary">{centerLabel}</span>
          )}
          {centerValue && (
            <span className="text-[20px] font-bold text-text-primary tabular-nums">
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
