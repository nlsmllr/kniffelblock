"use client";

import { useState } from "react";
import { Check, Dices, Trophy } from "lucide-react";
import {
  CATEGORY_LABELS,
  type CategoryKey,
  type GameState,
  hasRolled,
  ranking,
  ROLLS_PER_TURN,
  scoreFor,
} from "@/lib/kniffel";
import { Die } from "./Die";
import { ScoreSheet } from "./ScoreSheet";

export function GameView({
  state,
  viewerId,
  canAct,
  busy,
  onRoll,
  onHold,
  onScore,
  finishedActions,
  footer,
}: {
  state: GameState;
  viewerId?: string;
  canAct: boolean;
  busy?: boolean;
  onRoll: (held: boolean[]) => void;
  onHold: (held: boolean[]) => void;
  onScore: (category: CategoryKey) => void;
  finishedActions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // A selection only counts for the roll it was made on.
  const [selection, setSelection] = useState<{
    key: CategoryKey;
    rollId: number;
  } | null>(null);
  const current = state.players[state.current];
  const rolled = hasRolled(state);
  const playing = state.phase === "playing";
  const selected =
    playing && rolled && selection?.rollId === state.rollId
      ? selection.key
      : null;
  const canHold = playing && canAct && rolled && state.rollsLeft > 0 && !busy;
  const canRoll = playing && canAct && state.rollsLeft > 0 && !busy;
  const isMe = current?.id === viewerId;

  function select(key: CategoryKey) {
    if (selected === key) {
      onScore(key);
      setSelection(null);
    } else {
      setSelection({ key, rollId: state.rollId });
    }
  }

  function toggle(i: number) {
    if (!canHold) return;
    onHold(state.held.map((h, j) => (j === i ? !h : h)));
  }

  const status = !playing
    ? null
    : canAct
      ? viewerId
        ? "Du bist dran!"
        : `${current?.name} ist dran`
      : `Warte auf ${current?.name}…`;

  return (
    <div className="flex flex-col gap-3 pb-64 sm:pb-72">
      {state.phase === "finished" && (
        <Results state={state} actions={finishedActions} />
      )}

      <ScoreSheet
        state={state}
        viewerId={viewerId}
        canAct={canAct && !busy}
        selected={selected}
        onSelect={select}
      />
      {footer}

      {playing && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-red-700 bg-orange-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`font-bold ${canAct || isMe ? "text-red-700" : "text-lime-800"}`}
              >
                {status}
              </span>
              <span className="font-mono text-lime-800/70">
                Wurf {ROLLS_PER_TURN - state.rollsLeft}/{ROLLS_PER_TURN}
              </span>
            </div>

            <div className="flex justify-between gap-1 sm:justify-center sm:gap-4">
              {state.dice.map((d, i) => (
                <Die
                  key={`${i}-${state.rollId}`}
                  index={i}
                  value={d}
                  held={rolled && state.held[i]}
                  rolling={rolled && state.rolled[i]}
                  faded={!rolled}
                  disabled={!canHold}
                  onClick={() => toggle(i)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onRoll(state.held)}
                disabled={!canRoll}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-800 px-4 py-3 text-sm font-bold text-orange-50 transition-colors hover:bg-lime-900 disabled:bg-lime-800/30"
              >
                <Dices className="size-5" aria-hidden />
                {rolled ? "Nochmal" : "Würfeln"}
                <span className="font-mono font-normal opacity-70">
                  ({state.rollsLeft})
                </span>
              </button>
              {selected && canAct && (
                <button
                  type="button"
                  onClick={() => select(selected)}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-orange-50 transition-colors hover:bg-red-800 disabled:opacity-50"
                >
                  <Check className="size-5" aria-hidden />
                  <span className="truncate">
                    {CATEGORY_LABELS[selected]}:{" "}
                    {scoreFor(selected, state.dice)}
                  </span>
                </button>
              )}
            </div>
            {canAct && rolled && !selected && (
              <p className="-mt-1 text-center text-xs text-lime-800/70">
                {state.rollsLeft > 0
                  ? "Würfel antippen zum Halten · Feld im Block wählen zum Eintragen"
                  : "Keine Würfe mehr – wähle ein Feld im Block"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Results({
  state,
  actions,
}: {
  state: GameState;
  actions?: React.ReactNode;
}) {
  const ranked = ranking(state);
  const top = ranked[0]?.total ?? 0;
  return (
    <div className="rounded-2xl border-2 border-red-700 bg-orange-50 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-red-700">
        <Trophy className="size-5" aria-hidden /> Spiel beendet
      </h2>
      <ol className="mb-4 flex flex-col gap-1">
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 font-mono text-sm ${
              p.total === top ? "bg-lime-200 font-bold" : "bg-white/60"
            }`}
          >
            <span className="text-lime-900">
              {i + 1}. {p.name}
            </span>
            <span className="text-red-700">{p.total}</span>
          </li>
        ))}
      </ol>
      {actions}
    </div>
  );
}
