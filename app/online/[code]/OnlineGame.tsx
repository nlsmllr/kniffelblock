"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Crown, LogOut, Share2, X } from "lucide-react";
import { GameView } from "@/components/game/GameView";
import {
  AppHeader,
  Card,
  CardTitle,
  ErrorBox,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/game/ui";
import { api, ApiError, usePlayerId, useUsername } from "@/lib/client";
import type { GameState } from "@/lib/kniffel";

const POLL_MS = 1200;

export function OnlineGame({ code }: { code: string }) {
  const playerId = usePlayerId();
  const username = useUsername();
  const [game, setGame] = useState<GameState | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const versionRef = useRef(0);

  const apply = useCallback((state: GameState, force = false) => {
    if (!force && state.version <= versionRef.current) return;
    versionRef.current = state.version;
    setGame(state);
  }, []);

  // Poll the server for changes made by other players.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (document.visibilityState === "hidden") return;
      try {
        const state = await api(`/api/games/${code}`);
        if (!cancelled) apply(state);
      } catch (err) {
        if (!cancelled && err instanceof ApiError && err.status === 404) {
          setMissing(true);
        }
      }
    }
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [code, apply]);

  async function act(body: Record<string, unknown>, optimistic?: GameState) {
    setError(null);
    if (optimistic) setGame(optimistic);
    setBusy(!optimistic);
    try {
      apply(await api(`/api/games/${code}`, body));
    } catch (err) {
      setError((err as Error).message);
      // Re-sync after a rejected move.
      api(`/api/games/${code}`).then((s) => apply(s, true), () => {});
    } finally {
      setBusy(false);
    }
  }

  const me = game?.players.find((p) => p.id === playerId);
  const isMyTurn =
    game?.phase === "playing" && game.players[game.current]?.id === playerId;

  useEffect(() => {
    document.title = isMyTurn ? "🎲 Du bist dran! · Kniffel" : "Kniffel";
    if (isMyTurn) navigator.vibrate?.(120);
  }, [isMyTurn]);

  if (missing) {
    return (
      <Shell>
        <Card>
          <CardTitle>Spiel nicht gefunden</CardTitle>
          <p className="text-sm">
            Den Code <b className="font-mono">{code}</b> gibt es nicht (mehr).
            Spiele werden nach 24 Stunden gelöscht.
          </p>
          <Link href="/" className={primaryButton}>
            Zur Startseite
          </Link>
        </Card>
      </Shell>
    );
  }

  if (!game || playerId === null || username === null) {
    return (
      <Shell>
        <p className="font-display py-16 text-center text-3xl uppercase">Lade Spiel…</p>
      </Shell>
    );
  }

  const isHost = game.hostId === playerId;
  const errorBox = error && (
    <div className="mb-4">
      <ErrorBox>{error}</ErrorBox>
    </div>
  );

  function leave() {
    if (window.confirm("Spiel wirklich verlassen?")) {
      act({ action: "leave" }).then(() => {
        window.location.href = "/";
      });
    }
  }

  if (!me && game.phase === "lobby") {
    return (
      <Shell>
        {errorBox}
        <JoinForm
          game={game}
          defaultName={username}
          busy={busy}
          onJoin={(name) => act({ action: "join", name })}
        />
      </Shell>
    );
  }

  if (me && game.phase === "lobby") {
    return (
      <Shell actions={<LeaveButton onClick={leave} />}>
        {errorBox}
        <Lobby
          game={game}
          playerId={playerId}
          isHost={isHost}
          busy={busy}
          onStart={() => act({ action: "start" })}
          onKick={(id) => act({ action: "kick", targetId: id })}
        />
      </Shell>
    );
  }

  return (
    <Shell
      wide
      actions={
        <>
          <ShareButton code={code} compact />
          {me && <LeaveButton onClick={leave} />}
        </>
      }
    >
      {errorBox}
      {!me && (
        <p className="mb-4 border-[3px] border-ink bg-pop px-3 py-2 text-sm font-bold uppercase">
          Das Spiel läuft bereits – du schaust zu.
        </p>
      )}
      <GameView
        state={game}
        viewerId={playerId}
        canAct={isMyTurn}
        busy={busy}
        onRoll={(held) => act({ action: "roll", held })}
        onHold={(held) =>
          act({ action: "hold", held }, { ...game, held })
        }
        onScore={(category) => act({ action: "score", category })}
        footer={
          isHost &&
          game.phase === "playing" &&
          game.players.length > 1 && (
            <HostTools
              game={game}
              playerId={playerId}
              onKick={(id) => act({ action: "kick", targetId: id })}
            />
          )
        }
        finishedActions={
          isHost ? (
            <button
              type="button"
              onClick={() => act({ action: "restart" })}
              disabled={busy}
              className={`${primaryButton} w-full`}
            >
              Revanche
            </button>
          ) : (
            <p className="text-center text-sm font-bold uppercase">
              Der Host kann eine Revanche starten.
            </p>
          )
        }
      />
    </Shell>
  );
}

function Shell({
  children,
  actions,
  wide,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-col p-4 ${wide ? "h-dvh max-w-5xl pb-0" : "max-w-md"}`}
    >
      <AppHeader>{actions}</AppHeader>
      {children}
    </div>
  );
}

function LeaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Spiel verlassen"
      className={iconButton}
    >
      <LogOut className="size-4" aria-hidden />
    </button>
  );
}

function ShareButton({ code, compact }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/online/${code}`;
    const data = {
      title: "Kniffel",
      text: `Spiel mit mir Kniffel! Code: ${code}`,
      url,
    };
    if (navigator.share && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // Cancelled or unsupported: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Link kopieren:", url);
    }
  }

  const Icon = copied ? Check : compact ? Share2 : Copy;
  return (
    <button
      type="button"
      onClick={share}
      title="Einladungslink teilen"
      className={compact ? iconButton : `${secondaryButton} w-full`}
    >
      <Icon className="size-4" aria-hidden />
      {!compact && (copied ? "Link kopiert!" : "Einladungslink teilen")}
    </button>
  );
}

function JoinForm({
  game,
  defaultName,
  busy,
  onJoin,
}: {
  game: GameState;
  defaultName: string;
  busy: boolean;
  onJoin: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const host = game.players.find((p) => p.id === game.hostId);

  return (
    <Card>
      <CardTitle>Spiel {game.id} beitreten</CardTitle>
      <p className="text-sm">
        {host ? `${host.name} hat dich eingeladen. ` : ""}
        Mit dabei: {game.players.map((p) => p.name).join(", ") || "noch niemand"}
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onJoin(name);
        }}
      >
        <label htmlFor="join-name" className="text-sm font-bold uppercase">
          Dein Name
        </label>
        <input
          id="join-name"
          value={name}
          maxLength={20}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className={primaryButton}
        >
          Beitreten
        </button>
      </form>
    </Card>
  );
}

function Lobby({
  game,
  playerId,
  isHost,
  busy,
  onStart,
  onKick,
}: {
  game: GameState;
  playerId: string;
  isHost: boolean;
  busy: boolean;
  onStart: () => void;
  onKick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-center text-sm font-bold uppercase">Spielcode</p>
        <p className="font-display -rotate-2 border-[3px] border-ink bg-pop py-3 text-center text-6xl leading-none tracking-[0.15em] shadow-hard">
          {game.id}
        </p>
        <ShareButton code={game.id} />
      </Card>

      <Card>
        <CardTitle>Spieler ({game.players.length})</CardTitle>
        <ul className="flex flex-col gap-2">
          {game.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between border-[3px] border-ink bg-white/60 px-3 py-2 text-sm uppercase"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                {p.id === game.hostId && (
                  <Crown className="size-3.5 text-signal" fill="currentColor" aria-label="Host" />
                )}
                {p.name}
                {p.id === playerId && (
                  <span className="font-normal text-mute">(du)</span>
                )}
              </span>
              {isHost && p.id !== playerId && (
                <button
                  type="button"
                  onClick={() => onKick(p.id)}
                  aria-label={`${p.name} entfernen`}
                  className="border-2 border-transparent p-0.5 hover:border-ink hover:bg-coral"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
        {isHost ? (
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className={primaryButton}
          >
            {game.players.length === 1 ? "Alleine starten" : "Spiel starten"}
          </button>
        ) : (
          <p className="text-center text-sm font-bold uppercase">
            Warte, bis der Host das Spiel startet…
          </p>
        )}
      </Card>
    </div>
  );
}

function HostTools({
  game,
  playerId,
  onKick,
}: {
  game: GameState;
  playerId: string;
  onKick: (id: string) => void;
}) {
  return (
    <details className="text-sm font-bold uppercase">
      <summary className="cursor-pointer">Host: Spieler entfernen</summary>
      <ul className="mt-2 flex flex-wrap gap-2">
        {game.players
          .filter((p) => p.id !== playerId)
          .map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`${p.name} aus dem Spiel entfernen?`)) {
                    onKick(p.id);
                  }
                }}
                className={iconButton}
              >
                <X className="size-4" aria-hidden /> {p.name}
              </button>
            </li>
          ))}
      </ul>
    </details>
  );
}
