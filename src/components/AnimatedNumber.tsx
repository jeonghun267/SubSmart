"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 500,
  className = "",
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
