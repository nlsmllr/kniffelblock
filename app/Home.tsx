"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, LogIn, NotebookPen, Smartphone } from "lucide-react";
import {
  AppHeader,
  Card,
  CardTitle,
  ErrorBox,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/game/ui";
import { api, setUsername, useUsername } from "@/lib/client";

export function Home() {
  const router = useRouter();
  const username = useUsername();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (username === null) return null;
  const name = username.trim();

  async function createOnline() {
    if (!name) return setError("Bitte gib zuerst deinen Namen ein.");
    setBusy(true);
    setError(null);
    try {
      const state = await api("/api/games", { name });
      router.push(`/online/${state.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!c) return setError("Bitte gib einen Spielcode ein.");
    router.push(`/online/${c}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4">
      <AppHeader />

      <Card>
        <label htmlFor="username" className="font-display text-2xl leading-none uppercase">
          <span className="text-signal">01</span> Dein Name
        </label>
        <input
          id="username"
          value={username}
          maxLength={20}
          autoComplete="nickname"
          placeholder="z. B. Nils"
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          className={inputClass}
        />
      </Card>

      <Card>
        <CardTitle icon={<Smartphone className="size-5" />}>
          <span className="text-signal">02</span> Auf diesem Gerät
        </CardTitle>
        <p className="text-sm">
          Mehrere Spieler teilen sich ein Telefon oder einen Rechner und geben
          es nach jedem Zug weiter.
        </p>
        <Link href="/lokal" className={primaryButton}>
          Lokales Spiel
        </Link>
      </Card>

      <Card>
        <CardTitle icon={<Globe className="size-5" />}>
          <span className="text-signal">03</span> Online
        </CardTitle>
        <p className="text-sm">
          Jeder spielt auf seinem eigenen Gerät. Erstelle ein Spiel und teile
          den Code oder Link.
        </p>
        <button
          type="button"
          onClick={createOnline}
          disabled={busy}
          className={primaryButton}
        >
          Online-Spiel erstellen
        </button>
        <form onSubmit={join} className="flex gap-3">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Spielcode"
            aria-label="Spielcode"
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            className={`${inputClass} font-mono uppercase tracking-widest`}
          />
          <button type="submit" className={secondaryButton}>
            <LogIn className="size-4" aria-hidden />
            Beitreten
          </button>
        </form>
      </Card>

      {error && (
        <ErrorBox>{error}</ErrorBox>
      )}

      <Link
        href="/block"
        className="inline-flex items-center justify-center gap-2 self-center border-b-[3px] border-ink py-1 text-sm font-bold uppercase hover:bg-pop"
      >
        <NotebookPen className="size-4" aria-hidden />
        Nur Block (mit echten Würfeln)
      </Link>
    </div>
  );
}
