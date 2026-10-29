import { createHash, randomInt } from "node:crypto";
import type { GameState } from "./kniffel";

// Online games are stored in Redis via the Upstash REST API when configured
// (Vercel Marketplace "Upstash for Redis" sets KV_REST_API_*). Without it,
// an in-memory map is used, which only works for a single server process
// (e.g. `npm run dev`).

type GameRecord = {
  state: GameState;
  // playerId -> sha256(token); never sent to clients.
  tokens: Record<string, string>;
};

const TTL_SECONDS = 60 * 60 * 24;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const REDIS_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingRedis = Boolean(REDIS_URL && REDIS_TOKEN);

async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? "Redis-Fehler");
  return json.result as T;
}

const memory = ((globalThis as { __kniffelGames?: Map<string, string> })
  .__kniffelGames ??= new Map<string, string>());
const memoryLocks = new Set<string>();

const gameKey = (code: string) => `kniffel:game:${code}`;

async function readRaw(code: string): Promise<string | null> {
  if (usingRedis) return redis<string | null>(["GET", gameKey(code)]);
  return memory.get(gameKey(code)) ?? null;
}

async function writeRaw(code: string, value: string) {
  if (usingRedis) {
    await redis(["SET", gameKey(code), value, "EX", TTL_SECONDS]);
  } else {
    memory.set(gameKey(code), value);
  }
}

async function acquireLock(code: string) {
  const key = `kniffel:lock:${code}`;
  for (let i = 0; i < 40; i++) {
    if (usingRedis) {
      const ok = await redis<string | null>(["SET", key, "1", "NX", "PX", 3000]);
      if (ok) return () => redis(["DEL", key]).then(() => undefined);
    } else if (!memoryLocks.has(key)) {
      memoryLocks.add(key);
      return async () => void memoryLocks.delete(key);
    }
    await new Promise((r) => setTimeout(r, 75));
  }
  throw new Error("Server ist beschäftigt, bitte nochmal versuchen.");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newGameCode() {
  return Array.from(
    { length: 5 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export async function getGame(code: string): Promise<GameRecord | null> {
  const raw = await readRaw(code);
  return raw ? (JSON.parse(raw) as GameRecord) : null;
}

export async function createGameRecord(record: GameRecord) {
  await writeRaw(record.state.id, JSON.stringify(record));
}

// Read-modify-write under a short lock so concurrent joins/moves don't clobber
// each other.
export async function updateGame(
  code: string,
  fn: (record: GameRecord) => GameRecord,
): Promise<GameRecord | null> {
  const release = await acquireLock(code);
  try {
    const current = await getGame(code);
    if (!current) return null;
    const next = fn(current);
    if (next !== current) await writeRaw(code, JSON.stringify(next));
    return next;
  } finally {
    await release();
  }
}
