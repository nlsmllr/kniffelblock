import type { Metadata } from "next";
import { LocalGame } from "./LocalGame";

export const metadata: Metadata = { title: "Lokales Spiel · Kniffel" };

export default function LocalPage() {
  return (
    <main className="font-mono">
      <LocalGame />
    </main>
  );
}
