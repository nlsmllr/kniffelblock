const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

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
        className={`block border-[3px] border-ink transition-[transform,box-shadow] group-focus-visible:outline-[3px] group-focus-visible:outline-offset-2 group-focus-visible:outline-signal ${
          held
            ? "translate-x-[3px] translate-y-[3px] bg-signal shadow-none"
            : "bg-white shadow-hard"
        } ${faded ? "opacity-35" : ""}`}
      >
        <DieFace
          value={value}
          held={held}
          className={`size-12 sm:size-14 ${rolling ? "animate-dice-roll" : ""}`}
          style={rolling ? { animationDelay: `${index * 40}ms` } : undefined}
        />
      </span>
      <span
        className={`px-1 text-[10px] font-bold tracking-[0.15em] uppercase ${
          held ? "bg-ink text-paper" : "text-transparent"
        }`}
      >
        Halten
      </span>
    </button>
  );
}

export function DieFace({
  value,
  held,
  framed,
  className,
  style,
}: {
  value: number;
  held?: boolean;
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
          className={held ? "fill-paper" : "fill-ink"}
        />
      ))}
    </svg>
  );
}
