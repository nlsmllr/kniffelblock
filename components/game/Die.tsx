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
      className={`relative flex flex-col items-center gap-1 rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-lime-800 disabled:cursor-default ${
        held ? "-translate-y-1.5" : ""
      }`}
    >
      <DieFace
        value={value}
        held={held}
        className={`size-14 sm:size-16 drop-shadow-sm ${rolling ? "animate-dice-roll" : ""} ${
          faded ? "opacity-40" : ""
        }`}
        style={rolling ? { animationDelay: `${index * 40}ms` } : undefined}
      />
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          held ? "text-red-700" : "text-transparent"
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
  className,
  style,
}: {
  value: number;
  held?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="20"
        className={
          held ? "fill-red-700 stroke-red-800" : "fill-white stroke-lime-800/40"
        }
        strokeWidth="4"
      />
      {PIPS[value]?.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="9"
          className={held ? "fill-orange-50" : "fill-lime-900"}
        />
      ))}
    </svg>
  );
}
