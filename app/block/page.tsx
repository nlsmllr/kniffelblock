import type { Metadata } from "next";
import { Kniffelblock } from "../KniffelBlock";

export const metadata: Metadata = { title: "Kniffelblock" };

export default function BlockPage() {
  return (
    <main className="font-mono">
      <Kniffelblock />
    </main>
  );
}
