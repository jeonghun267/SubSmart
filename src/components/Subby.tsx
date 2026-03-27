"use client";

// Subby - SubSmart mascot
// A cute coin character with different expressions
type SubbyMood = "happy" | "worried" | "thinking" | "wink";

interface SubbyProps {
  size?: number;
  mood?: SubbyMood;
  className?: string;
}

export default function Subby({ size = 64, mood = "happy", className = "" }: SubbyProps) {
  const eyes: Record<SubbyMood, string> = {
    happy: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 32 20 Q 32 17, 35 17 Q 38 17, 38 20",
    worried: "M 19 19 L 23 21 M 33 21 L 37 19",
    thinking: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 34 18 A 2 2 0 1 1 34 22 A 2 2 0 1 1 34 18",
    wink: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 32 20 L 38 20",
  };

  const mouths: Record<SubbyMood, string> = {
    happy: "M 22 28 Q 28 33, 34 28",
    worried: "M 23 31 Q 28 27, 33 31",
    thinking: "M 25 29 Q 28 29, 31 29",
    wink: "M 22 28 Q 28 33, 34 28",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body - coin shape */}
      <circle cx="28" cy="28" r="26" fill="#FFD43B" />
      <circle cx="28" cy="28" r="22" fill="#FFEC99" stroke="#F59E0B" strokeWidth="1.5" />

      {/* Won symbol watermark */}
      <text
        x="28"
        y="46"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#F59E0B"
        opacity="0.3"
      >
        ₩
      </text>

      {/* Eyes */}
      <path
        d={eyes[mood]}
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Mouth */}
      <path
        d={mouths[mood]}
        stroke="#1E293B"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush */}
      {(mood === "happy" || mood === "wink") && (
        <>
          <circle cx="16" cy="25" r="3" fill="#FCA5A5" opacity="0.5" />
          <circle cx="40" cy="25" r="3" fill="#FCA5A5" opacity="0.5" />
        </>
      )}

      {/* Magnifying glass (thinking) */}
      {mood === "thinking" && (
        <g transform="translate(38, 8) rotate(30)">
          <circle cx="0" cy="0" r="5" stroke="#3182F6" strokeWidth="1.5" fill="none" />
          <line x1="3.5" y1="3.5" x2="8" y2="8" stroke="#3182F6" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
