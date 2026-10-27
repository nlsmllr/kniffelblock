"use client";

import { useSyncExternalStore } from "react";
import type { GameState } from "./kniffel";

// Browser-side helpers: the user's name and a per-device identity used to
// authenticate moves in online games.

const NAME_KEY = "kniffel-username";
const IDENTITY_KEY = "kniffel-identity";

type Identity = { playerId: string; token: string };

const listeners = new Set<() => void>();

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function setUsername(name: string) {
  safeSet(NAME_KEY, name.slice(0, 20));
  listeners.forEach((l) => l());
}

/** Returns null during SSR / before hydration. */
export function useUsername(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => safeGet(NAME_KEY) ?? "",
    () => null,
  );
}

export function randomId(bytes: number) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

let cachedIdentity: Identity | null = null;

export function getIdentity(): Identity {
  if (cachedIdentity) return cachedIdentity;
  cachedIdentity = loadIdentity();
  return cachedIdentity;
}

/** The device's player id, or null during SSR. */
export function usePlayerId(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getIdentity().playerId,
    () => null,
  );
}

function loadIdentity(): Identity {
  const raw = safeGet(IDENTITY_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Identity;
      if (parsed.playerId && parsed.token) return parsed;
    } catch {}
  }
  const identity = { playerId: randomId(12), token: randomId(24) };
  safeSet(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export async function api(
  path: string,
  body?: Record<string, unknown>,
): Promise<GameState> {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify({ ...getIdentity(), ...body }) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    state?: GameState;
    error?: string;
  };
  if (!res.ok || !json.state) {
    throw new ApiError(json.error ?? "Verbindungsfehler.", res.status);
  }
  return json.state;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/* ---------- local (same-device) game persistence ---------- */

const LOCAL_GAME_KEY = "kniffel-local-game";
let cachedRaw: string | null = null;
let cachedGame: GameState | null = null;

function readLocalGame(): GameState | null {
  const raw = safeGet(LOCAL_GAME_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedGame = raw ? (JSON.parse(raw) as GameState) : null;
    } catch {
      cachedGame = null;
    }
  }
  return cachedGame;
}

export function saveLocalGame(state: GameState | null) {
  try {
    if (state) window.localStorage.setItem(LOCAL_GAME_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(LOCAL_GAME_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

/** `undefined` until hydrated, `null` if there is no saved local game. */
export function useLocalGame(): GameState | null | undefined {
  return useSyncExternalStore(subscribe, readLocalGame, () => undefined);
}
