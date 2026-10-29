import {
  addPlayer,
  type CategoryKey,
  chooseCategory,
  cleanName,
  GameError,
  type GameState,
  removePlayer,
  renamePlayer,
  restartGame,
  rollDice,
  setHeld,
  startGame,
} from "@/lib/kniffel";
import { errorResponse, readIdentity } from "@/lib/api";
import { getGame, hashToken, normalizeCode, updateGame } from "@/lib/store";

type Ctx = { params: Promise<{ code: string }> };

const notFound = () =>
  Response.json({ error: "Spiel nicht gefunden." }, { status: 404 });

export async function GET(_request: Request, ctx: Ctx) {
  const code = normalizeCode((await ctx.params).code);
  const record = await getGame(code);
  if (!record) return notFound();
  return Response.json(
    { state: record.state },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const code = normalizeCode((await ctx.params).code);
    const body = await request.json();
    const { playerId, token } = readIdentity(body);
    const action = String(body.action ?? "");

    const record = await updateGame(code, (rec) => {
      const known = rec.tokens[playerId];
      if (known && known !== hashToken(token)) {
        throw new GameError("Ungültige Spieler-Identität.");
      }

      if (action === "join") {
        if (known) return rec; // Rejoining from the same device.
        const state = addPlayer(rec.state, {
          id: playerId,
          name: cleanName(body.name),
        });
        return {
          state,
          tokens: { ...rec.tokens, [playerId]: hashToken(token) },
        };
      }

      if (!known) throw new GameError("Du bist nicht in diesem Spiel.");
      const isHost = rec.state.hostId === playerId;
      let state: GameState;

      switch (action) {
        case "start":
          if (!isHost) throw new GameError("Nur der Host kann starten.");
          state = startGame(rec.state);
          break;
        case "restart":
          if (!isHost) throw new GameError("Nur der Host kann neu starten.");
          state = restartGame(rec.state);
          break;
        case "roll":
          state = rollDice(rec.state, playerId, body.held ?? []);
          break;
        case "hold":
          state = setHeld(rec.state, playerId, body.held ?? []);
          break;
        case "score":
          state = chooseCategory(
            rec.state,
            playerId,
            body.category as CategoryKey,
          );
          break;
        case "rename":
          state = renamePlayer(rec.state, playerId, body.name);
          break;
        case "leave":
          state = removePlayer(rec.state, playerId);
          break;
        case "kick": {
          const target = String(body.targetId ?? "");
          if (!isHost) throw new GameError("Nur der Host kann Spieler entfernen.");
          state = removePlayer(rec.state, target);
          break;
        }
        default:
          throw new GameError("Unbekannte Aktion.");
      }

      const removed = rec.state.players
        .map((p) => p.id)
        .filter((id) => !state.players.some((p) => p.id === id));
      const tokens = { ...rec.tokens };
      for (const id of removed) delete tokens[id];
      return { state, tokens };
    });

    if (!record) return notFound();
    return Response.json({ state: record.state });
  } catch (err) {
    return errorResponse(err);
  }
}
