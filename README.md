# Kniffel

Kniffel zum Würfeln und Eintragen – mit Next.js.

- **Lokales Spiel** (`/lokal`): mehrere Spieler auf einem Telefon/Rechner, Gerät wird weitergereicht. Spielstand bleibt im Browser gespeichert.
- **Online-Spiel** (`/online/CODE`): jeder auf seinem eigenen Gerät. Spiel erstellen, Code oder Link teilen, Host startet. Gewürfelt wird auf dem Server, Züge werden pro Gerät mit einem geheimen Token geprüft.
- **Nur Block** (`/block`): der digitale Kniffelblock zum Mitschreiben mit echten Würfeln.

Der Username wird im Browser gespeichert und für neue Spiele vorausgefüllt.

## Entwicklung

```bash
npm install
npm run dev
```

Ohne weitere Konfiguration werden Online-Spiele im Speicher des Servers gehalten – das reicht für `npm run dev` (auch mit mehreren Geräten im selben WLAN über `http://<deine-IP>:3000`).

## Deployment (Vercel)

Serverless-Funktionen teilen keinen Speicher, daher braucht der Online-Modus in Produktion eine Redis-Datenbank:

1. Im Vercel-Projekt unter **Storage → Marketplace** „Upstash for Redis“ (kostenloser Plan reicht) hinzufügen und mit dem Projekt verbinden.
2. Dadurch werden `KV_REST_API_URL` und `KV_REST_API_TOKEN` gesetzt (alternativ `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
3. Neu deployen.

Spiele werden nach 24 Stunden automatisch gelöscht.

## Aufbau

- `lib/kniffel.ts` – Regeln & Spiellogik (Punkte, Züge, Würfeln), genutzt von Client und Server
- `lib/store.ts` – Speicherung der Online-Spiele (Upstash Redis oder In-Memory)
- `app/api/games` – API zum Erstellen, Beitreten und Spielen
- `components/game` – Würfel, Spielblock und Spielansicht
