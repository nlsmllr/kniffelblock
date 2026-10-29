"use client";

import { useEffect, useState } from "react";

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

// Faces shown while a die is in the air, before it lands on its real value.
const FLICKER_TICKS = 6;
const FLICKER_MS = 65;
const STAGGER_MS = 60;

function useFlicker(active: boolean, delay: number) {
  const [face, setFace] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticks = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        ticks++;
        if (ticks > FLICKER_TICKS) {
          window.clearInterval(interval);
          setFace(null);
        } else {
          setFace(1 + Math.floor(Math.random() * 6));
        }
      }, FLICKER_MS);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [active, delay]);
  return face;
}

export function Die({
  value,
  held,
  rolling,
  faded,
  disabled,
  onClick,
  index,
}: {
  value: number;
  held?: boolean;
  rolling?: boolean;
  faded?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  index: number;
}) {
  const delay = index * STAGGER_MS;
  const flicker = useFlicker(Boolean(rolling), delay);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={held}
      aria-label={`Würfel ${index + 1}: ${value}${held ? ", gehalten" : ""}`}
      className="group relative flex flex-col items-center gap-1.5 outline-none disabled:cursor-default"
    >
      <span
        className={`block origin-bottom border-[3px] border-ink transition-[transform,box-shadow,background-color] group-focus-visible:outline-[3px] group-focus-visible:outline-offset-2 group-focus-visible:outline-ink ${
          held
            ? "translate-x-[3px] translate-y-[3px] bg-coral shadow-none"
            : "bg-white shadow-hard"
        } ${faded ? "opacity-35" : ""} ${rolling ? "motion-safe:animate-dice-tumble" : ""}`}
        style={rolling ? { animationDelay: `${delay}ms` } : undefined}
      >
        <DieFace value={flicker ?? value} className="size-12 sm:size-14" />
      </span>
      <span
        className={`border-2 px-1 text-[10px] font-bold tracking-[0.15em] uppercase ${
          held ? "border-ink bg-coral" : "border-transparent text-transparent"
        }`}
      >
        Halten
      </span>
    </button>
  );
}

export function DieFace({
  value,
  framed,
  className,
  style,
}: {
  value: number;
  /** Draw its own square outline (for small inline dice). */
  framed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      {framed && (
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          className="fill-white stroke-ink"
          strokeWidth="10"
        />
      )}
      {PIPS[value]?.map(([cx, cy], i) => (
        <rect
          key={i}
          x={cx - 9}
          y={cy - 9}
          width="18"
          height="18"
          className="fill-ink"
        />
      ))}
    </svg>
  );
}
