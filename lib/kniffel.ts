// Shared Kniffel rules engine: used by the client (local games) and the
// server (online games). All functions are pure and return new state.

export const UPPER_CATEGORIES = [
  { key: "ones", label: "Einser", face: 1 },
  { key: "twos", label: "Zweier", face: 2 },
  { key: "threes", label: "Dreier", face: 3 },
  { key: "fours", label: "Vierer", face: 4 },
  { key: "fives", label: "Fünfer", face: 5 },
  { key: "sixes", label: "Sechser", face: 6 },
] as const;

export const LOWER_CATEGORIES = [
  { key: "threeKind", label: "Dreier-Pasch", hint: "Alle Augen" },
  { key: "fourKind", label: "Vierer-Pasch", hint: "Alle Augen" },
  { key: "fullHouse", label: "Full House", hint: "25" },
  { key: "smallStraight", label: "Kleine Straße", hint: "30" },
  { key: "largeStraight", label: "Große Straße", hint: "40" },
  { key: "kniffel", label: "Kniffel", hint: "50" },
  { key: "chance", label: "Chance", hint: "Alle Augen" },
] as const;

export type UpperKey = (typeof UPPER_CATEGORIES)[number]["key"];
export type LowerKey = (typeof LOWER_CATEGORIES)[number]["key"];
export type CategoryKey = UpperKey | LowerKey;

export const CATEGORY_KEYS: CategoryKey[] = [
  ...UPPER_CATEGORIES.map((c) => c.key),
  ...LOWER_CATEGORIES.map((c) => c.key),
];

export const CATEGORY_LABELS: Record<CategoryKey, string> = Object.fromEntries(
  [...UPPER_CATEGORIES, ...LOWER_CATEGORIES].map((c) => [c.key, c.label]),
) as Record<CategoryKey, string>;

export const ROLLS_PER_TURN = 3;
export const MAX_PLAYERS = 8;
export const BONUS_THRESHOLD = 63;
export const BONUS_POINTS = 35;

export type Scores = Partial<Record<CategoryKey, number>>;

export type GamePlayer = {
  id: string;
  name: string;
  scores: Scores;
};

export type GamePhase = "lobby" | "playing" | "finished";

export type GameState = {
  id: string;
  phase: GamePhase;
  players: GamePlayer[];
  hostId: string;
  current: number;
  dice: number[];
  held: boolean[];
  // Which dice changed on the last roll (for the roll animation).
  rolled: boolean[];
  rollsLeft: number;
  // Increments on every roll so viewers can animate remote rolls.
  rollId: number;
  version: number;
  updatedAt: number;
  lastMove?: { playerId: string; category: CategoryKey; points: number };
};

export class GameError extends Error {}

/* ---------- scoring ---------- */

function counts(dice: number[]) {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) c[d]++;
  return c;
}

const sum = (dice: number[]) => dice.reduce((a, b) => a + b, 0);

function hasRun(dice: number[], length: number) {
  const set = new Set(dice);
  for (let start = 1; start + length - 1 <= 6; start++) {
    let ok = true;
    for (let v = start; v < start + length; v++) if (!set.has(v)) ok = false;
    if (ok) return true;
  }
  return false;
}

export function scoreFor(category: CategoryKey, dice: number[]): number {
  if (dice.length !== 5 || dice.some((d) => d < 1 || d > 6)) return 0;
  const c = counts(dice);
  const max = Math.max(...c);
  const upper = UPPER_CATEGORIES.find((u) => u.key === category);
  if (upper) return c[upper.face] * upper.face;

  switch (category) {
    case "threeKind":
      return max >= 3 ? sum(dice) : 0;
    case "fourKind":
      return max >= 4 ? sum(dice) : 0;
    case "fullHouse":
      return c.includes(3) && c.includes(2) ? 25 : 0;
    case "smallStraight":
      return hasRun(dice, 4) ? 30 : 0;
    case "largeStraight":
      return hasRun(dice, 5) ? 40 : 0;
    case "kniffel":
      return max === 5 ? 50 : 0;
    case "chance":
      return sum(dice);
  }
  return 0;
}

export function upperSum(s: Scores) {
  return UPPER_CATEGORIES.reduce((acc, c) => acc + (s[c.key] ?? 0), 0);
}
export function bonus(s: Scores) {
  return upperSum(s) >= BONUS_THRESHOLD ? BONUS_POINTS : 0;
}
export function upperTotal(s: Scores) {
  return upperSum(s) + bonus(s);
}
export function lowerSum(s: Scores) {
  return LOWER_CATEGORIES.reduce((acc, c) => acc + (s[c.key] ?? 0), 0);
}
export function grandTotal(s: Scores) {
  return upperTotal(s) + lowerSum(s);
}
export function isComplete(s: Scores) {
  return CATEGORY_KEYS.every((k) => s[k] !== undefined);
}

/* ---------- state transitions ---------- */

type RandomInt = (maxExclusive: number) => number;

const defaultRandom: RandomInt = (max) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
};

export function createGame(
  id: string,
  host: { id: string; name: string },
): GameState {
  return {
    id,
    phase: "lobby",
    players: [{ id: host.id, name: host.name, scores: {} }],
    hostId: host.id,
    current: 0,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rolled: [false, false, false, false, false],
    rollsLeft: ROLLS_PER_TURN,
    rollId: 0,
    version: 1,
    updatedAt: Date.now(),
  };
}

function bump(state: GameState): GameState {
  return { ...state, version: state.version + 1, updatedAt: Date.now() };
}

function resetTurn(state: GameState): GameState {
  return {
    ...state,
    held: [false, false, false, false, false],
    rollsLeft: ROLLS_PER_TURN,
  };
}

export function cleanName(name: unknown) {
  const n = String(name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
  if (!n) throw new GameError("Bitte gib einen Namen ein.");
  return n;
}

export function addPlayer(
  state: GameState,
  player: { id: string; name: string },
): GameState {
  if (state.players.some((p) => p.id === player.id)) return state;
  if (state.phase !== "lobby")
    throw new GameError("Das Spiel läuft bereits.");
  if (state.players.length >= MAX_PLAYERS)
    throw new GameError(`Maximal ${MAX_PLAYERS} Spieler.`);
  return bump({
    ...state,
    players: [...state.players, { ...player, scores: {} }],
  });
}

export function renamePlayer(
  state: GameState,
  playerId: string,
  name: string,
): GameState {
  return bump({
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, name: cleanName(name) } : p,
    ),
  });
}

export function removePlayer(state: GameState, playerId: string): GameState {
  const index = state.players.findIndex((p) => p.id === playerId);
  if (index === -1) return state;
  const players = state.players.filter((p) => p.id !== playerId);
  if (players.length === 0) return bump({ ...state, players });

  let current = state.current;
  let next: GameState = { ...state, players };
  if (index < current) current--;
  else if (index === current) {
    current = current % players.length;
    next = resetTurn(next);
  }
  next.current = current;
  if (next.hostId === playerId) next.hostId = players[0].id;
  if (next.phase === "playing" && players.every((p) => isComplete(p.scores)))
    next.phase = "finished";
  return bump(next);
}

export function startGame(state: GameState): GameState {
  if (state.phase !== "lobby") return state;
  if (state.players.length === 0) throw new GameError("Keine Spieler.");
  return bump(resetTurn({ ...state, phase: "playing", current: 0 }));
}

export function restartGame(state: GameState): GameState {
  return bump(
    resetTurn({
      ...state,
      phase: "playing",
      current: 0,
      lastMove: undefined,
      players: state.players.map((p) => ({ ...p, scores: {} })),
    }),
  );
}

function assertTurn(state: GameState, playerId: string) {
  if (state.phase !== "playing") throw new GameError("Das Spiel läuft nicht.");
  if (state.players[state.current]?.id !== playerId)
    throw new GameError("Du bist nicht am Zug.");
}

export function hasRolled(state: GameState) {
  return state.rollsLeft < ROLLS_PER_TURN;
}

export function rollDice(
  state: GameState,
  playerId: string,
  held: boolean[],
  random: RandomInt = defaultRandom,
): GameState {
  assertTurn(state, playerId);
  if (state.rollsLeft <= 0) throw new GameError("Keine Würfe mehr übrig.");
  // Nothing can be held before the first roll of a turn.
  const keep = hasRolled(state)
    ? [0, 1, 2, 3, 4].map((i) => Boolean(held[i]))
    : [false, false, false, false, false];
  const dice = state.dice.map((d, i) => (keep[i] ? d : random(6) + 1));
  return bump({
    ...state,
    dice,
    held: keep,
    rolled: keep.map((k) => !k),
    rollsLeft: state.rollsLeft - 1,
    rollId: state.rollId + 1,
  });
}

export function setHeld(
  state: GameState,
  playerId: string,
  held: boolean[],
): GameState {
  assertTurn(state, playerId);
  if (!hasRolled(state)) return state;
  return bump({ ...state, held: [0, 1, 2, 3, 4].map((i) => Boolean(held[i])) });
}

export function chooseCategory(
  state: GameState,
  playerId: string,
  category: CategoryKey,
): GameState {
  assertTurn(state, playerId);
  if (!CATEGORY_KEYS.includes(category))
    throw new GameError("Unbekanntes Feld.");
  if (!hasRolled(state)) throw new GameError("Erst würfeln!");
  const player = state.players[state.current];
  if (player.scores[category] !== undefined)
    throw new GameError("Dieses Feld ist schon belegt.");

  const points = scoreFor(category, state.dice);
  const players = state.players.map((p, i) =>
    i === state.current
      ? { ...p, scores: { ...p.scores, [category]: points } }
      : p,
  );
  const finished = players.every((p) => isComplete(p.scores));

  // Advance to the next player that still has open fields.
  let current = state.current;
  if (!finished) {
    do {
      current = (current + 1) % players.length;
    } while (isComplete(players[current].scores));
  }

  return bump(
    resetTurn({
      ...state,
      players,
      current,
      phase: finished ? "finished" : "playing",
      lastMove: { playerId, category, points },
    }),
  );
}

export function ranking(state: GameState) {
  return [...state.players]
    .map((p) => ({ ...p, total: grandTotal(p.scores) }))
    .sort((a, b) => b.total - a.total);
}
