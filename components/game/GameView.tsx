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
import { primaryButton } from "./ui";

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
    <div className="flex flex-col gap-4 pb-64 sm:pb-72">
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
        <div className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-ink bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <div className="flex items-stretch justify-between gap-2 text-sm">
              <span
                className={`truncate px-2 py-0.5 font-bold uppercase ${
                  canAct || isMe ? "border-2 border-ink bg-coral" : "border-2 border-ink bg-stone"
                }`}
              >
                {status}
              </span>
              <span className="flex items-center gap-1" aria-label={`Wurf ${ROLLS_PER_TURN - state.rollsLeft} von ${ROLLS_PER_TURN}`}>
                {Array.from({ length: ROLLS_PER_TURN }, (_, i) => (
                  <span
                    key={i}
                    className={`size-4 border-2 border-ink ${
                      i < ROLLS_PER_TURN - state.rollsLeft ? "bg-ink" : "bg-paper"
                    }`}
                  />
                ))}
              </span>
            </div>

            <div className="flex justify-between gap-1 sm:justify-center sm:gap-5">
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onRoll(state.held)}
                disabled={!canRoll}
                className={`${primaryButton} flex-1`}
              >
                <Dices className="size-5" aria-hidden />
                {rolled ? "Nochmal" : "Würfeln"}
                <span className="font-normal opacity-70">
                  [{state.rollsLeft}]
                </span>
              </button>
              {selected && canAct && (
                <button
                  type="button"
                  onClick={() => select(selected)}
                  disabled={busy}
                  className={`${primaryButton} flex-1 bg-mint! hover:bg-pop!`}
                >
                  <Check className="size-5" aria-hidden />
                  <span className="truncate">
                    {CATEGORY_LABELS[selected]}: {scoreFor(selected, state.dice)}
                  </span>
                </button>
              )}
            </div>
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
    <div className="border-[3px] border-ink bg-paper shadow-hard">
      <h2 className="font-display flex items-center gap-2 border-b-[3px] border-ink bg-coral px-4 py-2 text-3xl leading-none uppercase">
        <Trophy className="size-6" aria-hidden /> Spiel beendet
      </h2>
      <ol className="flex flex-col">
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between border-t-[3px] border-ink px-4 py-2 text-sm font-bold uppercase first:border-t-0 ${
              p.total === top ? "bg-pop" : ""
            }`}
          >
            <span>
              {String(i + 1).padStart(2, "0")} — {p.name}
            </span>
            <span className="font-display text-2xl text-signal">{p.total}</span>
          </li>
        ))}
      </ol>
      {actions && <div className="border-t-[3px] border-ink p-4">{actions}</div>}
    </div>
  );
}
