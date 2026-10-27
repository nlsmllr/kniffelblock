import { cleanName, createGame } from "@/lib/kniffel";
import {
  createGameRecord,
  getGame,
  hashToken,
  newGameCode,
} from "@/lib/store";
import { errorResponse, readIdentity } from "@/lib/api";

// Create a new online game; the creator becomes host and first player.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, token } = readIdentity(body);
    const name = cleanName(body.name);

    let code = newGameCode();
    for (let i = 0; i < 5 && (await getGame(code)); i++) code = newGameCode();

    const state = createGame(code, { id: playerId, name });
    await createGameRecord({ state, tokens: { [playerId]: hashToken(token) } });
    return Response.json({ state });
  } catch (err) {
    return errorResponse(err);
  }
}
