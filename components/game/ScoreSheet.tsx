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
                  clickable
                    ? `${points} Punkte bei ${CATEGORY_LABELS[key]}`
                    : undefined
                }
                className={`relative flex h-full min-h-11 w-full items-center justify-center text-sm tabular-nums outline-none focus-visible:bg-pop ${
                  isSelected
                    ? "bg-ink text-paper"
                    : clickable
                      ? "cursor-pointer hover:bg-pop"
                      : justScored
                        ? "bg-signal text-paper"
                        : ""
                }`}
              >
                {!open ? (
                  value === 0 ? (
                    <span className="font-bold tracking-tighter">
                      {"/////"}
                    </span>
                  ) : (
                    <span className="font-bold">{value}</span>
                  )
                ) : preview ? (
                  <span
                    className={
                      isSelected
                        ? "text-base font-bold"
                        : points
                          ? "font-bold text-signal"
                          : "text-mute"
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
    <div className="w-full overflow-x-auto overscroll-x-contain border-[3px] border-ink bg-paper shadow-hard">
      <div className="flex w-fit min-w-full flex-col">
        <Row className="sticky top-0 z-30 border-b-[3px]! bg-paper">
          <LabelCell header>
            <span className="text-[10px] tracking-[0.2em] text-mute uppercase">
              Spieler
            </span>
          </LabelCell>
          {players.map((p, i) => {
            const leader =
              best > 0 && grandTotal(p.scores) === best && players.length > 1;
            const isCurrent = playing && i === state.current;
            return (
              <Cell key={p.id} current={isCurrent}>
                <div
                  className={`flex min-h-11 items-center justify-center gap-1 px-1 py-1 text-center text-xs font-bold uppercase sm:text-sm ${
                    isCurrent ? "bg-ink text-paper" : ""
                  }`}
                >
                  {leader && (
                    <Crown
                      className="size-3.5 shrink-0 text-signal"
                      fill="currentColor"
                      aria-label="Führend"
                    />
                  )}
                  <span className="truncate">
                    {p.name}
                    {p.id === viewerId && (
                      <span className="opacity-50"> (du)</span>
                    )}
                  </span>
                </div>
              </Cell>
            );
          })}
        </Row>

        <SectionBar>Oben</SectionBar>
        {UPPER_CATEGORIES.map((c) =>
          categoryRow(
            c.key,
            <span className="flex items-center gap-2">
              <DieFace value={c.face} framed className="size-5 shrink-0" />
              <span>{c.label}</span>
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
              Bonus <span className="text-mute">ab {BONUS_THRESHOLD}</span>
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
        />

        <SectionBar>Unten</SectionBar>
        {LOWER_CATEGORIES.map((c) =>
          categoryRow(
            c.key,
            <span className="flex flex-col leading-tight">
              <span>{c.label}</span>
              <span className="text-[10px] font-normal text-mute">
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
          final
          last
        />
      </div>
    </div>
  );
}

type P = GameState["players"][number];

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky left-0 w-full border-b-[3px] border-ink bg-moss px-2 py-0.5 text-[10px] font-bold tracking-[0.3em] text-paper uppercase sm:px-3">
      {children}
    </div>
  );
}

function TotalRow({
  label,
  players,
  value,
  strong,
  final,
  highlight,
  hint,
  last,
}: {
  label: React.ReactNode;
  players: P[];
  value: (p: P) => number;
  strong?: boolean;
  final?: boolean;
  highlight?: (p: P) => boolean;
  hint?: (p: P) => string | null;
  last?: boolean;
}) {
  return (
    <Row last={last} className={strong ? "border-b-[3px]! bg-stone" : "bg-stone"}>
      <LabelCell muted>
        <span className={final ? "font-display text-lg uppercase" : ""}>
          {label}
        </span>
      </LabelCell>
      {players.map((p) => {
        const h = hint?.(p);
        return (
          <Cell key={p.id} highlight={highlight?.(p)}>
            <div className="flex min-h-11 flex-col items-center justify-center tabular-nums">
              <span
                className={
                  final
                    ? "font-display text-2xl text-signal"
                    : strong
                      ? "text-base font-bold text-signal"
                      : "text-sm font-bold"
                }
              >
                {value(p)}
              </span>
              {h && (
                <span className="text-[10px] leading-none text-mute">{h}</span>
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
      className={`flex w-full ${last ? "" : "border-b border-ink"} ${className}`}
    >
      {children}
    </div>
  );
}

function LabelCell({
  children,
  header,
  muted,
}: {
  children?: React.ReactNode;
  header?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`sticky left-0 ${header ? "z-40" : "z-20"} flex w-[124px] shrink-0 items-center border-r-[3px] border-ink px-2 py-1.5 text-xs font-bold uppercase sm:w-[170px] sm:px-3 sm:text-sm ${
        muted ? "bg-stone" : "bg-paper"
      }`}
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
      className={`min-w-[76px] flex-1 shrink-0 border-l border-ink first-of-type:border-l-0 sm:min-w-[110px] ${
        highlight ? "bg-pop" : current ? "bg-pop/40" : ""
      }`}
    >
      {children}
    </div>
  );
}
