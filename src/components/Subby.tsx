"use client";

// Subby - SubSmart mascot with level system
type SubbyMood = "happy" | "worried" | "thinking" | "wink" | "sleepy" | "celebration";

interface SubbyProps {
  size?: number;
  mood?: SubbyMood;
  level?: number;
  className?: string;
}

export default function Subby({ size = 64, mood = "happy", level = 1, className = "" }: SubbyProps) {
  const eyes: Record<SubbyMood, string> = {
    happy: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 32 20 Q 32 17, 35 17 Q 38 17, 38 20",
    worried: "M 19 19 L 23 21 M 33 21 L 37 19",
    thinking: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 34 18 A 2 2 0 1 1 34 22 A 2 2 0 1 1 34 18",
    wink: "M 18 20 Q 18 17, 21 17 Q 24 17, 24 20 M 32 20 L 38 20",
    sleepy: "M 18 21 L 24 21 M 32 21 L 38 21",
    celebration: "M 18 18 Q 18 15, 21 15 Q 24 15, 24 18 M 32 18 Q 32 15, 35 15 Q 38 15, 38 18",
  };

  const mouths: Record<SubbyMood, string> = {
    happy: "M 22 28 Q 28 33, 34 28",
    worried: "M 23 31 Q 28 27, 33 31",
    thinking: "M 25 29 Q 28 29, 31 29",
    wink: "M 22 28 Q 28 33, 34 28",
    sleepy: "M 25 30 Q 28 31, 31 30",
    celebration: "M 20 27 Q 28 35, 36 27",
  };

  // Level-based colors
  const outerColor = level >= 6 ? "#60A5FA" : level >= 5 ? "#F59E0B" : "#FFD43B";
  const innerColor = level >= 6 ? "#BFDBFE" : level >= 5 ? "#FDE68A" : "#FFEC99";
  const strokeColor = level >= 6 ? "#3B82F6" : level >= 5 ? "#D97706" : "#F59E0B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Level 7: Rainbow glow */}
      {level >= 7 && (
        <circle cx="28" cy="28" r="27.5" stroke="url(#rainbow)" strokeWidth="1.5" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Level 2+: Sparkle particles */}
      {level >= 2 && (
        <>
          <circle cx="8" cy="12" r="1.5" fill="#FCD34D" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="48" cy="14" r="1" fill="#FCD34D" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="46" cy="42" r="1.2" fill="#FCD34D" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Level 5+: Glow effect */}
      {level >= 5 && (
        <circle cx="28" cy="28" r="26" fill={outerColor} opacity="0.15">
          <animate attributeName="r" values="26;28;26" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Body - coin shape */}
      <circle cx="28" cy="28" r="26" fill={outerColor} />
      <circle cx="28" cy="28" r="22" fill={innerColor} stroke={strokeColor} strokeWidth="1.5" />

      {/* Won symbol watermark */}
      <text
        x="28"
        y="46"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill={strokeColor}
        opacity="0.3"
      >
        ₩
      </text>

      {/* Level 3+: Crown */}
      {level >= 3 && (
        <g transform="translate(28, 2)">
          <path
            d="M -8 4 L -6 -2 L -3 2 L 0 -4 L 3 2 L 6 -2 L 8 4 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="0.8"
          />
        </g>
      )}

      {/* Sleepy ZZZ */}
      {mood === "sleepy" && (
        <g>
          <text x="40" y="12" fontSize="8" fontWeight="bold" fill="#6366F1" opacity="0.7">z</text>
          <text x="44" y="8" fontSize="6" fontWeight="bold" fill="#6366F1" opacity="0.5">z</text>
          <text x="47" y="5" fontSize="4" fontWeight="bold" fill="#6366F1" opacity="0.3">z</text>
        </g>
      )}

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
      {(mood === "happy" || mood === "wink" || mood === "celebration") && (
        <>
          <circle cx="16" cy="25" r="3" fill="#FCA5A5" opacity="0.5" />
          <circle cx="40" cy="25" r="3" fill="#FCA5A5" opacity="0.5" />
        </>
      )}

      {/* Celebration: confetti stars */}
      {mood === "celebration" && (
        <>
          <text x="6" y="10" fontSize="7">🎉</text>
          <text x="42" y="8" fontSize="6">✨</text>
          <text x="4" y="48" fontSize="5">⭐</text>
          <text x="46" y="46" fontSize="6">🎊</text>
        </>
      )}

      {/* Magnifying glass (thinking) */}
      {mood === "thinking" && (
        <g transform="translate(38, 8) rotate(30)">
          <circle cx="0" cy="0" r="5" stroke="#3182F6" strokeWidth="1.5" fill="none" />
          <line x1="3.5" y1="3.5" x2="8" y2="8" stroke="#3182F6" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* Level 4+: Wings */}
      {level >= 4 && (
        <>
          <path d="M 2 24 Q -4 20, 0 16 Q 4 20, 2 24" fill={outerColor} opacity="0.6" />
          <path d="M 54 24 Q 60 20, 56 16 Q 52 20, 54 24" fill={outerColor} opacity="0.6" />
        </>
      )}

      {/* Gradient defs for rainbow */}
      {level >= 7 && (
        <defs>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="75%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
