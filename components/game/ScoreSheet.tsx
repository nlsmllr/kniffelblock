import { Crown } from "lucide-react";
import {
  bonus,
  CATEGORY_LABELS,
  BONUS_THRESHOLD,
  type CategoryKey,
  type GameState,
  grandTotal,
  hasRolled,
  LOWER_CATEGORIES,
  lowerSum,
  scoreFor,
  UPPER_CATEGORIES,
  upperSum,
  upperTotal,
} from "@/lib/kniffel";
import { DieFace } from "./Die";

export function ScoreSheet({
  state,
  viewerId,
  canAct,
  selected,
  onSelect,
}: {
  state: GameState;
  viewerId?: string;
  canAct: boolean;
  selected: CategoryKey | null;
  onSelect: (key: CategoryKey) => void;
}) {
  const { players } = state;
  const playing = state.phase === "playing";
  const rolled = playing && hasRolled(state);
  const best = Math.max(0, ...players.map((p) => grandTotal(p.scores)));

  function categoryRow(key: CategoryKey, label: React.ReactNode) {
    return (
      <Row key={key}>
        <LabelCell>{label}</LabelCell>
        {players.map((p, i) => {
          const value = p.scores[key];
          const isCurrent = playing && i === state.current;
          const open = value === undefined;
          const preview = isCurrent && open && rolled;
          const points = preview ? scoreFor(key, state.dice) : null;
          const clickable = preview && canAct;
          const isSelected = clickable && selected === key;
          const justScored =
            state.lastMove?.playerId === p.id &&
            state.lastMove.category === key;

          return (
            <Cell key={p.id} current={isCurrent}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onSelect(key)}
                aria-label={
                  clickable ? `${points} Punkte bei ${CATEGORY_LABELS[key]}` : undefined
                }
                className={`relative flex h-full min-h-10 w-full items-center justify-center font-mono text-sm tabular-nums transition-colors ${
                  isSelected
                    ? "bg-lime-800 text-orange-50"
                    : clickable
                      ? "cursor-pointer hover:bg-lime-100"
                      : justScored
                        ? "bg-red-100"
                        : ""
                }`}
              >
                {!open ? (
                  value === 0 ? (
                    <span className="tracking-tighter text-lime-900">
                      {"/////"}
                    </span>
                  ) : (
                    <span className="font-semibold text-lime-800">{value}</span>
                  )
                ) : preview ? (
                  <span
                    className={
                      isSelected
                        ? "font-bold"
                        : points
                          ? "font-semibold text-red-700/70"
                          : "text-lime-800/30"
                    }
                  >
                    {points}
                  </span>
                ) : null}
              </button>
            </Cell>
          );
        })}
      </Row>
    );
  }

  return (
    <div className="w-full overflow-x-auto overscroll-x-contain rounded-t-xl rounded-b-3xl border-2 border-red-700 bg-orange-50">
      <div className="flex w-fit min-w-full flex-col">
        <Row className="sticky top-0 z-30 border-b-2 border-red-200 bg-orange-50">
          <LabelCell header />
          {players.map((p, i) => {
            const leader =
              best > 0 && grandTotal(p.scores) === best && players.length > 1;
            return (
              <Cell key={p.id} current={playing && i === state.current}>
                <div className="flex min-h-10 items-center justify-center gap-1 px-1 py-1 text-center text-xs font-semibold text-lime-800 sm:text-sm">
                  {leader && (
                    <Crown
                      className="size-3.5 shrink-0 text-red-600"
                      fill="currentColor"
                      aria-label="Führend"
                    />
                  )}
                  <span className="truncate">
                    {p.name}
                    {p.id === viewerId && (
                      <span className="text-lime-800/50"> (du)</span>
                    )}
                  </span>
                </div>
              </Cell>
            );
          })}
        </Row>

        {UPPER_CATEGORIES.map((c) =>
          categoryRow(
            c.key,
            <span className="flex items-center gap-2">
              <DieFace value={c.face} className="size-5 shrink-0" />
              <span className="text-lime-900">{c.label}</span>
            </span>,
          ),
        )}

        <TotalRow
          label="Summe oben"
          players={players}
          value={(p) => upperSum(p.scores)}
        />
        <TotalRow
          label={
            <span>
              Bonus{" "}
              <span className="text-lime-800/50">ab {BONUS_THRESHOLD}</span>
            </span>
          }
          players={players}
          value={(p) => bonus(p.scores)}
          highlight={(p) => bonus(p.scores) > 0}
          hint={(p) => {
            const missing = BONUS_THRESHOLD - upperSum(p.scores);
            return missing > 0 ? `noch ${missing}` : null;
          }}
        />
        <TotalRow
          label="Gesamt oben"
          players={players}
          value={(p) => upperTotal(p.scores)}
          strong
          last
        />

        <div className="h-3 w-full border-y border-red-200 bg-red-50" />

        {LOWER_CATEGORIES.map((c) =>
          categoryRow(
            c.key,
            <span className="flex flex-col leading-tight">
              <span className="text-red-700">{c.label}</span>
              <span className="text-[10px] font-normal text-lime-800/50">
                {c.hint}
              </span>
            </span>,
          ),
        )}

        <TotalRow
          label="Gesamt unten"
          players={players}
          value={(p) => lowerSum(p.scores)}
        />
        <TotalRow
          label="Gesamt oben"
          players={players}
          value={(p) => upperTotal(p.scores)}
        />
        <TotalRow
          label="Endsumme"
          players={players}
          value={(p) => grandTotal(p.scores)}
          strong
          last
        />
      </div>
    </div>
  );
}

type P = GameState["players"][number];

function TotalRow({
  label,
  players,
  value,
  strong,
  highlight,
  hint,
  last,
}: {
  label: React.ReactNode;
  players: P[];
  value: (p: P) => number;
  strong?: boolean;
  highlight?: (p: P) => boolean;
  hint?: (p: P) => string | null;
  last?: boolean;
}) {
  return (
    <Row last={last}>
      <LabelCell>
        <span className="text-lime-800">{label}</span>
      </LabelCell>
      {players.map((p) => {
        const h = hint?.(p);
        return (
          <Cell key={p.id} highlight={highlight?.(p)}>
            <div className="flex min-h-10 flex-col items-center justify-center font-mono tabular-nums">
              <span
                className={
                  strong
                    ? "text-base font-bold text-red-700"
                    : "text-sm font-semibold text-lime-800"
                }
              >
                {value(p)}
              </span>
              {h && (
                <span className="text-[10px] leading-none text-lime-800/40">
                  {h}
                </span>
              )}
            </div>
          </Cell>
        );
      })}
    </Row>
  );
}

function Row({
  children,
  last,
  className = "",
}: {
  children: React.ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full ${last ? "" : "border-b border-red-200"} ${className}`}
    >
      {children}
    </div>
  );
}

function LabelCell({
  children,
  header,
}: {
  children?: React.ReactNode;
  header?: boolean;
}) {
  return (
    <div
      className={`sticky left-0 ${header ? "z-40" : "z-20"} flex w-[124px] shrink-0 items-center border-r border-lime-300 bg-orange-50 px-2 py-1.5 text-xs font-semibold sm:w-[170px] sm:px-3 sm:text-sm`}
    >
      {children}
    </div>
  );
}

function Cell({
  children,
  current,
  highlight,
}: {
  children: React.ReactNode;
  current?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-[76px] flex-1 shrink-0 border-l border-lime-300 sm:min-w-[110px] ${
        highlight ? "bg-lime-200" : current ? "bg-lime-50" : ""
      }`}
    >
      {children}
    </div>
  );
}
