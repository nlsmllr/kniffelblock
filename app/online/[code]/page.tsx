import type { Metadata } from "next";
import { OnlineGame } from "./OnlineGame";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return { title: `Spiel ${code.toUpperCase()} · Kniffel` };
}

export default async function OnlinePage({ params }: Props) {
  const { code } = await params;
  return (
    <main className="font-mono">
      <OnlineGame code={code.toUpperCase().replace(/[^A-Z0-9]/g, "")} />
    </main>
  );
}
