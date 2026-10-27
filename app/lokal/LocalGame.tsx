"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2, X } from "lucide-react";
import { GameView } from "@/components/game/GameView";
import {
  AppHeader,
  Card,
  CardTitle,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/game/ui";
import { randomId, saveLocalGame, useLocalGame, useUsername } from "@/lib/client";
import {
  addPlayer,
  chooseCategory,
  createGame,
  type GameState,
  MAX_PLAYERS,
  restartGame,
  rollDice,
  setHeld,
  startGame,
} from "@/lib/kniffel";

export function LocalGame() {
  const game = useLocalGame();
  const username = useUsername();

  if (game === undefined || username === null) return null;
  if (!game) return <Setup defaultName={username.trim()} />;
  return <Playing game={game} />;
}

function Setup({ defaultName }: { defaultName: string }) {
  const [names, setNames] = useState<string[]>([defaultName, ""]);

  function start() {
    const list = names.map(
      (n, i) => n.replace(/\s+/g, " ").trim().slice(0, 20) || `Spieler ${i + 1}`,
    );
    let state = createGame("local", { id: randomId(8), name: list[0] });
    for (const name of list.slice(1)) {
      state = addPlayer(state, { id: randomId(8), name });
    }
    saveLocalGame(startGame(state));
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <AppHeader />
      <Card>
        <CardTitle>Wer spielt mit?</CardTitle>
        <ul className="flex flex-col gap-2">
          {names.map((n, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={n}
                maxLength={20}
                placeholder={`Spieler ${i + 1}`}
                aria-label={`Name Spieler ${i + 1}`}
                onChange={(e) =>
                  setNames((prev) =>
                    prev.map((p, j) => (j === i ? e.target.value : p)),
                  )
                }
                className={inputClass}
              />
              {names.length > 1 && (
                <button
                  type="button"
                  aria-label={`Spieler ${i + 1} entfernen`}
                  onClick={() =>
                    setNames((prev) => prev.filter((_, j) => j !== i))
                  }
                  className={iconButton}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
        {names.length < MAX_PLAYERS && (
          <button
            type="button"
            onClick={() => setNames((prev) => [...prev, ""])}
            className={secondaryButton}
          >
            <Plus className="size-4" aria-hidden /> Spieler hinzufügen
          </button>
        )}
        <button type="button" onClick={start} className={primaryButton}>
          Spiel starten
        </button>
      </Card>
    </div>
  );
}

function Playing({ game }: { game: GameState }) {
  const current = game.players[game.current];

  function update(fn: (s: GameState) => GameState) {
    try {
      saveLocalGame(fn(game));
    } catch (err) {
      window.alert((err as Error).message);
    }
  }

  function restart() {
    if (window.confirm("Neues Spiel mit denselben Spielern starten?")) {
      update(restartGame);
    }
  }

  function quit() {
    if (window.confirm("Spiel beenden und Spieler neu wählen?")) {
      saveLocalGame(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <AppHeader>
        <button
          type="button"
          onClick={restart}
          title="Neu starten"
          className={iconButton}
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={quit}
          title="Spiel beenden"
          className={iconButton}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </AppHeader>
      <GameView
        state={game}
        canAct
        onRoll={(held) => update((s) => rollDice(s, current.id, held))}
        onHold={(held) => update((s) => setHeld(s, current.id, held))}
        onScore={(cat) => update((s) => chooseCategory(s, current.id, cat))}
        finishedActions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update(restartGame)}
              className={`${primaryButton} flex-1`}
            >
              Revanche
            </button>
            <button
              type="button"
              onClick={() => saveLocalGame(null)}
              className={`${secondaryButton} flex-1`}
            >
              Neue Spieler
            </button>
          </div>
        }
      />
    </div>
  );
}
