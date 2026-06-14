"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Heart,
  Plus,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";

type ScoreMap = Record<string, number | null>;

type Player = {
  id: string;
  name: string;
  scores: ScoreMap;
};

const DICE = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// Upper section rows: key, label, the die face (1-6)
const UPPER = [
  { key: "ones", label: "Nur Einsen zählen", face: 1, max: 5 },
  { key: "twos", label: "Nur Zweien zählen", face: 2, max: 10 },
  { key: "threes", label: "Nur Dreien zählen", face: 3, max: 15 },
  { key: "fours", label: "Nur Vieren zählen", face: 4, max: 20 },
  { key: "fives", label: "Nur Fünfen zählen", face: 5, max: 25 },
  { key: "sixes", label: "Nur Sechsen zählen", face: 6, max: 30 },
] as const;

// Lower section rows: key, label, the hint shown in the small middle cell
const LOWER = [
  {
    key: "threeKind",
    label: "Dreier-Pasch",
    hint: "Alle Augen zählen",
    max: 30,
  },
  {
    key: "fourKind",
    label: "Vierer-Pasch",
    hint: "Alle Augen zählen",
    max: 30,
  },
  { key: "fullHouse", label: "Full House", hint: "25", max: 25, fixed: 25 },
  {
    key: "smallStraight",
    label: "Kleine Straße",
    hint: "30",
    max: 30,
    fixed: 30,
  },
  {
    key: "largeStraight",
    label: "Große Straße",
    hint: "40",
    max: 40,
    fixed: 40,
  },
  {
    key: "kniffel",
    label: "Kniffel",
    hint: "50",
    max: 50,
    fixed: 50,
    hearts: true,
  },
  { key: "chance", label: "Chance", hint: "Alle Augen zählen", max: 30 },
] as const;

const ALL_KEYS = [...UPPER.map((r) => r.key), ...LOWER.map((r) => r.key)];

function emptyScores(): ScoreMap {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, null]));
}

function makePlayer(index: number): Player {
  return {
    id: crypto.randomUUID(),
    name: `Spieler ${index + 1}`,
    scores: emptyScores(),
  };
}

const STORAGE_KEY = "kniffelblock-v1";

export function Kniffelblock() {
  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window === "undefined") {
      return [makePlayer(0), makePlayer(1)];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Player[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            scores: { ...emptyScores(), ...p.scores },
          }));
        }
      }
    } catch {
      // ignore corrupt storage
    }

    return [makePlayer(0), makePlayer(1)];
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players, loaded]);

  function setScore(playerId: string, key: string, value: number | null) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, scores: { ...p.scores, [key]: value } } : p,
      ),
    );
  }

  function setName(playerId: string, name: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name } : p)),
    );
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, makePlayer(prev.length)]);
  }

  function removePlayer(playerId: string) {
    setPlayers((prev) =>
      prev.length <= 1 ? prev : prev.filter((p) => p.id !== playerId),
    );
  }

  function reset() {
    setPlayers((prev) => prev.map((p) => ({ ...p, scores: emptyScores() })));
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto w-full sm:p-12 p-4">
      <Header onAdd={addPlayer} onReset={reset} />

      {/* Container: 
          - snap-x snap-mandatory für den harten horizontalen Stop
          - scroll-pl-[130px] sm:scroll-pl-[160px] damit es nicht unter dem fixierten Header einrastet 
      */}
      {/* <div className="overflow-auto snap-x snap-mandatory scroll-pl-[130px] sm:scroll-pl-[160px] max-h-[calc(100dvh-140px)] sm:max-h-[80vh] w-full rounded-4xl border-2 border-rose-600 bg-white shadow-sm"> */}

      <div className="overflow-auto overscroll-none snap-x snap-mandatory scroll-pl-[130px] sm:scroll-pl-[160px] max-h-[calc(100dvh-140px)] sm:max-h-[80vh] w-full rounded-4xl border-2 border-rose-600 bg-white shadow-sm">
        {/* <div className="flex flex-col w-full min-w-max"> */}
        <div className="flex flex-col w-fit min-w-full">
          <UpperSection
            players={players}
            onScore={setScore}
            onName={setName}
            onRemove={removePlayer}
            canRemove={players.length > 1}
          />

          <div className="h-3 w-full bg-rose-50 border-y border-rose-200" />

          <LowerSection players={players} onScore={setScore} />
        </div>
      </div>
    </div>
  );
}

/* ---------- header ---------- */

function Header({
  onAdd,
  onReset,
}: {
  onAdd: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mb-3 flex gap-4 flex-row items-end justify-between">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-teal-700 sm:text-4xl">
          KNIFFEL<span className="text-rose-600">BLOCK</span>
        </h1>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ---------- upper section ---------- */

function upperSum(scores: ScoreMap) {
  return UPPER.reduce((acc, r) => acc + (scores[r.key] ?? 0), 0);
}
function bonus(scores: ScoreMap) {
  return upperSum(scores) >= 63 ? 35 : 0;
}
function upperTotal(scores: ScoreMap) {
  return upperSum(scores) + bonus(scores);
}
function lowerSum(scores: ScoreMap) {
  return LOWER.reduce((acc, r) => acc + (scores[r.key] ?? 0), 0);
}
function grandTotal(scores: ScoreMap) {
  return upperTotal(scores) + lowerSum(scores);
}

function UpperSection({
  players,
  onScore,
  onName,
  onRemove,
  canRemove,
}: {
  players: Player[];
  onScore: (id: string, key: string, v: number | null) => void;
  onName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <section className="flex flex-col w-full">
      <Row className="sticky top-0 z-30 bg-white shadow-sm border-b-2 border-rose-200">
        <LabelCell className="text-gray-900" isHeader />
        {players.map((p) => (
          <div
            key={p.id}
            // snap-start hinzugefügt
            // className="snap-start flex-1 shrink-0 border-l border-gray-300 p-1 bg-white relative flex items-center justify-center"
            className="snap-start flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] border-l border-gray-300 p-1 bg-white relative flex items-center justify-center"
          >
            <div className="flex items-center gap-0.5 w-full">
              <input
                aria-label="Spielername"
                value={p.name}
                onChange={(e) => onName(p.id, e.target.value)}
                className="w-full min-w-0 rounded bg-transparent px-1 py-1 text-center text-sm font-semibold text-teal-700 outline-none focus:bg-gray-100"
              />
              {canRemove && (
                <button
                  type="button"
                  aria-label={`${p.name} entfernen`}
                  onClick={() => onRemove(p.id)}
                  className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-rose-600 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </Row>

      {UPPER.map((r) => {
        const Die = DICE[r.face - 1];
        return (
          <Row key={r.key}>
            <LabelCell>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Die
                    key={i}
                    className="size-4 text-rose-600 sm:size-5"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </LabelCell>
            {players.map((p) => (
              <ScoreCell
                key={p.id}
                value={p.scores[r.key]}
                max={r.max}
                step={r.face}
                onChange={(v) => onScore(p.id, r.key, v)}
              />
            ))}
          </Row>
        );
      })}

      <Row>
        <LabelCell className="text-teal-700">Gesamt</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={upperSum(p.scores)} />
        ))}
      </Row>
      <Row>
        <LabelCell className="text-teal-700">Bonus ab 63</LabelCell>
        {players.map((p) => (
          <TotalCell
            key={p.id}
            value={bonus(p.scores)}
            highlight={bonus(p.scores) > 0}
          />
        ))}
      </Row>
      <Row last>
        <LabelCell className="text-teal-700">Gesamt Oben →</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={upperTotal(p.scores)} strong />
        ))}
      </Row>
    </section>
  );
}

/* ---------- lower section ---------- */

function LowerSection({
  players,
  onScore,
}: {
  players: Player[];
  onScore: (id: string, key: string, v: number | null) => void;
}) {
  return (
    <section className="flex flex-col w-full">
      {LOWER.map((r) => (
        <Row key={r.key}>
          <LabelCell className="text-rose-600">
            {"hearts" in r && r.hearts ? (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className="size-4 fill-teal-600 text-teal-600 sm:size-5"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : (
              r.label
            )}
          </LabelCell>
          {players.map((p) => (
            <ScoreCell
              key={p.id}
              value={p.scores[r.key]}
              max={r.max}
              fixed={"fixed" in r ? r.fixed : undefined}
              onChange={(v) => onScore(p.id, r.key, v)}
            />
          ))}
        </Row>
      ))}

      <Row>
        <LabelCell className="text-teal-700">Gesamt Unten →</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={lowerSum(p.scores)} />
        ))}
      </Row>
      <Row>
        <LabelCell className="text-teal-700">Gesamt Oben →</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={upperTotal(p.scores)} />
        ))}
      </Row>
      <Row last>
        <LabelCell className="text-teal-700">Endsumme →</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={grandTotal(p.scores)} strong />
        ))}
      </Row>
    </section>
  );
}

/* ---------- table primitives ---------- */

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
      className={`flex w-full ${last ? "" : "border-b border-rose-200"} ${className}`}
    >
      {children}
    </div>
  );
}

function LabelCell({
  children,
  className = "",
  isHeader = false,
}: {
  children?: React.ReactNode;
  className?: string;
  isHeader?: boolean;
}) {
  return (
    <div
      className={`w-[130px] sm:w-[160px] shrink-0 sticky left-0 ${
        isHeader ? "z-40" : "z-20"
      } flex items-center border-r border-gray-300 px-2 py-2 text-sm font-semibold sm:px-3 bg-white shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)] ${className}`}
    >
      {children}
    </div>
  );
}

function ScoreCell({
  value,
  onChange,
  max,
  step,
  fixed,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
  step?: number;
  fixed?: number;
}) {
  const isFilled = value !== null && value > 0;
  const isStruck = value === 0;

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    if (raw === "") return onChange(null);
    let n = Math.floor(Number(raw));
    if (Number.isNaN(n)) return;
    if (n < 0) n = 0;
    if (max !== undefined && n > max) n = max;
    onChange(n);
  }

  return (
    // <div className="snap-start flex-1 shrink-0 border-l border-gray-300 bg-white relative z-10">
    <div className="snap-start flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] border-l border-gray-300 bg-white relative z-10">
      <input
        inputMode="numeric"
        value={value === null ? "" : value}
        onChange={handle}
        placeholder={fixed ? String(fixed) : ""}
        className={`h-full min-h-10 w-full bg-transparent text-center font-mono text-sm tabular-nums outline-none transition-colors focus:bg-gray-100 ${
          isFilled ? "font-semibold text-teal-700" : "text-gray-900"
        } ${isStruck ? "text-gray-400 line-through" : ""}`}
        aria-label="Punkte"
      />
    </div>
  );
}

function TotalCell({
  value,
  strong,
  highlight,
}: {
  value: number;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    // <div
    //   className={`snap-start flex-1 shrink-0 border-l border-gray-300 relative z-10 flex min-h-10 items-center justify-center px-1 font-mono tabular-nums ${
    //     highlight ? "bg-teal-50" : "bg-white"
    //   }`}
    // >
    <div
      className={`snap-start flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] border-l border-gray-300 relative z-10 flex min-h-10 items-center justify-center px-1 font-mono tabular-nums ${
        highlight ? "bg-teal-50" : "bg-white"
      }`}
    >
      <span
        className={
          strong
            ? "text-base font-bold text-rose-600"
            : "text-sm font-semibold text-teal-700"
        }
      >
        {value}
      </span>
    </div>
  );
}
