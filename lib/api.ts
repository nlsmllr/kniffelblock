import { GameError } from "@/lib/kniffel";

export function readIdentity(body: unknown) {
  const { playerId, token } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof playerId !== "string" ||
    typeof token !== "string" ||
    playerId.length < 8 ||
    playerId.length > 64 ||
    token.length < 16 ||
    token.length > 128
  ) {
    throw new GameError("Ungültige Spieler-Identität.");
  }
  return { playerId, token };
}

export function errorResponse(err: unknown) {
  if (err instanceof GameError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  console.error(err);
  return Response.json(
    { error: "Serverfehler, bitte nochmal versuchen." },
    { status: 500 },
  );
}
