# @manyang/korean-analyzer

Warm Korean morphological analyzer (Kiwi) served over HTTP. The dream matcher calls
it to normalize inflected forms (e.g. `올라갔어` → `올라가`) so symbol/scene-cue
matching works on natural Korean. The main app talks to it through
`HttpKoreanLemmatizer` (`MANYANG_LEMMATIZER_URL`); if this service is down or unset,
the app falls back to plain lexical matching.

## Why a separate service
Kiwi loads a ~tens-of-MB model and is best kept **warm** (load once, serve many).
Keeping it out of the serverless request path avoids per-cold-start model loads, and
lets other consumers (search-data generation, admin tools) reuse the same endpoint.

## Run locally
```bash
npm install
npm run fetch-model        # downloads Kiwi v0.23.0 base model into ./models
npm start                  # listens on :8080
```
Then point the app at it:
```
MANYANG_LEMMATIZER_URL=http://localhost:8080
```

## API (the contract the app expects)
```
POST /lemmatize   { "text": "맑은 물에서 올라갔어" }
200               { "lemmas": ["맑", "물", "올라가"] }   # content stems (N*/V*/XR/SL)

GET  /health      { "status": "ok", "kiwi": "0.23.0" }
```

## Config (env)
- `PORT` (default `8080`)
- `KIWI_MODEL_DIR` (default `./models/cong/base`)
- `KIWI_WASM_PATH` (default `node_modules/kiwi-nlp/dist/kiwi-wasm.wasm`)
- `KIWI_MODEL_VERSION` for `fetch-model` (default `v0.23.0`, must match the kiwi-nlp version)

## Deploy
Any warm Node host (Fly.io / Render / Railway / container). Run `fetch-model` at
build time (or bake the model into the image), then `npm start`. Keep it private to
the app network.
