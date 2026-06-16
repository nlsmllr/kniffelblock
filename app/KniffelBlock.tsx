"use client";

import React, { useEffect, useState } from "react";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Plus,
  RotateCcw,
  Crown,
  Trash2,
  X,
} from "lucide-react";

type ScoreMap = Record<string, number | null>;

type Player = {
  id: string;
  name: string;
  scores: ScoreMap;
};

const DICE = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const UPPER = [
  { key: "ones", label: "Nur Einsen zählen", face: 1, steps: [1, 2, 3, 4, 5] },
  { key: "twos", label: "Nur Zweien zählen", face: 2, steps: [2, 4, 6, 8, 10] },
  {
    key: "threes",
    label: "Nur Dreien zählen",
    face: 3,
    steps: [3, 6, 9, 12, 15],
  },
  {
    key: "fours",
    label: "Nur Vieren zählen",
    face: 4,
    steps: [4, 8, 12, 16, 20],
  },
  {
    key: "fives",
    label: "Nur Fünfen zählen",
    face: 5,
    steps: [5, 10, 15, 20, 25],
  },
  {
    key: "sixes",
    label: "Nur Sechsen zählen",
    face: 6,
    steps: [6, 12, 18, 24, 30],
  },
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

function makePlayer(): Player {
  return {
    id: crypto.randomUUID(),
    name: ``,
    scores: emptyScores(),
  };
}

const STORAGE_KEY = "kniffelblock-storage";

export function Kniffelblock() {
  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window === "undefined") {
      return [makePlayer(), makePlayer()];
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
    } catch {}

    return [makePlayer()];
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
    setPlayers((prev) => [...prev, makePlayer()]);
  }

  function removePlayer(playerId: string) {
    setPlayers((prev) =>
      prev.length <= 1 ? prev : prev.filter((p) => p.id !== playerId),
    );
  }

  function reset() {
    setPlayers((prev) => prev.map((p) => ({ ...p, scores: emptyScores() })));
  }

  function hardReset() {
    if (window.confirm("Willst du wirklich alles löschen?")) {
      setPlayers([makePlayer()]);
    }
  }

  if (!loaded) return null;

  return (
    // HIER: 'h-full flex flex-col' hinzugefügt, damit es die Höhe aus der page.tsx übernimmt
    <div className="mx-auto w-full h-full flex flex-col sm:p-12 p-4">
      <Header onAdd={addPlayer} onReset={reset} onHardReset={hardReset} />

      {/* HIER: 'max-h-[calc(100dvh-80px)]' und 'sm:max-h-screen' ENTFERNT!
        DAFÜR: 'flex-1 min-h-0' hinzugefügt. (min-h-0 ist wichtig, damit das Scrollen im Flex-Container klappt)
      */}
      <div className="flex-1 min-h-0 overflow-auto overscroll-none snap-x snap-mandatory scroll-pl-[130px] sm:scroll-pl-[160px] w-full rounded-t-xl rounded-b-4xl border-2 border-red-600 bg-white shadow-lg">
        <div className="flex flex-col w-fit min-w-full">
          <UpperSection
            players={players}
            onScore={setScore}
            onName={setName}
            onRemove={removePlayer}
            canRemove={players.length > 1}
          />

          <div className="h-3 w-full bg-red-50 border-y border-red-200" />

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
  onHardReset,
}: {
  onAdd: () => void;
  onReset: () => void;
  onHardReset: () => void;
}) {
  return (
    <div className="mb-3 flex gap-4 flex-row items-end justify-between">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-teal-700 sm:text-4xl">
          KNIFFEL<span className="text-red-600">BLOCK</span>
        </h1>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          title="Spieler hinzufügen"
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Punkte zurücksetzen"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        {/* --- NEUER BUTTON --- */}
        <button
          type="button"
          onClick={onHardReset}
          title="Alles löschen (Neustart)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          <Trash2 className="size-4" aria-hidden="true" />
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
  // Ermittle die aktuelle Höchstpunktzahl (Endsumme) aller Spieler
  const highestScore = Math.max(...players.map((p) => grandTotal(p.scores)));

  return (
    <section className="flex flex-col w-full">
      <Row className="sticky top-0 z-30 bg-white border-b-2 border-red-200">
        <LabelCell className="text-gray-900" isHeader />
        {players.map((p, index) => {
          // Spieler bekommt eine Krone, wenn er die Höchstpunktzahl hat und diese > 0 ist
          const isLeader =
            highestScore > 0 && grandTotal(p.scores) === highestScore;

          return (
            <div
              key={p.id}
              className="snap-start flex-1 shrink-0 min-w-[120px] border-l border-gray-300 p-1 bg-white relative flex items-center justify-center min-h-[40px]"
            >
              {/* Container für Name & Krone (mit px-6 Padding, damit langer Text nicht unter das X rutscht) */}
              <div className="flex items-center justify-center w-full px-6">
                {isLeader && (
                  <Crown
                    className="size-4 shrink-0 text-amber-400 mr-1"
                    fill="currentColor"
                    aria-label="Führend"
                  />
                )}

                <input
                  aria-label="Spielername"
                  value={p.name}
                  placeholder={`P${index + 1}`}
                  onChange={(e) => onName(p.id, e.target.value)}
                  className="w-full min-w-0 rounded bg-transparent py-1 text-center text-sm font-semibold text-teal-700 outline-none focus:bg-gray-100 placeholder:text-teal-700/50"
                />

                {/* Unsichtbares Gegengewicht zur Krone, damit das Input-Feld exakt zentriert bleibt */}
                {isLeader && <div className="size-4 shrink-0 ml-1" />}
              </div>

              {/* Absolute Positionierung löst das X aus dem zentrierten Layout */}
              {canRemove && (
                <button
                  type="button"
                  aria-label={`${p.name || `Spieler ${index + 1}`} entfernen`}
                  onClick={() => onRemove(p.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:bg-red-600 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </Row>

      {UPPER.map((r) => {
        const Die = DICE[r.face - 1];
        return (
          <Row key={r.key}>
            <LabelCell>
              <div className="flex items-center gap-0.5 sm:gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Die
                    key={i}
                    className="text-red-600 size-5"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </LabelCell>
            {players.map((p) => (
              <ScoreCell
                key={p.id}
                value={p.scores[r.key]}
                steps={r.steps}
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
        <LabelCell className="text-teal-700 gap-1.75">
          <p>{"Bonus"}</p>
          <p className="text-teal-700/50">{"ab 63"}</p>
        </LabelCell>
        {players.map((p) => (
          <TotalCell
            key={p.id}
            value={bonus(p.scores)}
            highlight={bonus(p.scores) > 0}
          />
        ))}
      </Row>
      <Row last>
        <LabelCell className="text-teal-700">Gesamt Oben</LabelCell>
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
          <LabelCell className="text-red-600">
            {"hearts" in r && r.hearts ? (
              <div className="flex items-center gap-0.5">Kniffel</div>
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
        <LabelCell className="text-teal-700">Gesamt Unten</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={lowerSum(p.scores)} />
        ))}
      </Row>
      <Row>
        <LabelCell className="text-teal-700">Gesamt Oben</LabelCell>
        {players.map((p) => (
          <TotalCell key={p.id} value={upperTotal(p.scores)} />
        ))}
      </Row>
      <Row last>
        <LabelCell className="text-teal-700 mb-1">Endsumme</LabelCell>
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
      className={`flex w-full ${last ? "" : "border-b border-red-200"} ${className}`}
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
      } flex items-center border-r border-gray-300 px-2 py-2 text-sm font-semibold sm:px-3 bg-white ${className}`}
    >
      {children}
    </div>
  );
}

function ScoreCell({
  value,
  onChange,
  max,
  steps,
  fixed,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
  steps?: readonly number[];
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

    // Nimm den maximalen Wert aus den steps, falls vorhanden
    const currentMax = steps ? steps[steps.length - 1] : max;
    if (currentMax !== undefined && n > currentMax) n = currentMax;

    onChange(n);
  }

  function handleBlur() {
    // Wenn es einen Wert gibt und steps definiert sind, snappe zum nächsten gültigen Wert
    if (value !== null && value !== 0 && steps) {
      if (!steps.includes(value)) {
        // 0 bleibt immer eine gültige Option (Streichergebnis)
        const validOptions = [0, ...steps];
        const closest = validOptions.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
        );
        onChange(closest);
      }
    }
  }

  return (
    <div className="snap-start flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] border-l border-gray-300 bg-white relative z-10">
      <input
        inputMode="numeric"
        value={value === null ? "" : value}
        onChange={handle}
        onBlur={handleBlur}
        placeholder={fixed ? String(fixed) : ""}
        className={`h-full min-h-10 w-full bg-transparent text-center font-mono text-sm tabular-nums outline-none transition-colors focus:bg-gray-100 ${
          isFilled ? "font-semibold text-teal-700" : "text-gray-900"
        } ${isStruck ? "font-extrabold relative z-10" : "relative z-10"}`}
        aria-label="Punkte"
      />

      {isStruck && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <span className="font-normal tracking-tighter text-gray-900">
            {"/////"}
          </span>
        </div>
      )}
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
      className={`snap-start flex-1 shrink-0 min-w-[170px] border-l border-gray-300 relative z-10 flex min-h-10 items-center justify-center px-1 font-mono tabular-nums ${
        highlight ? "bg-teal-50" : "bg-white"
      }`}
    >
      <span
        className={
          strong
            ? "text-base font-bold text-red-600"
            : "text-sm font-semibold text-teal-700"
        }
      >
        {value}
      </span>
    </div>
  );
}
