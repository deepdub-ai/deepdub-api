# Deepdub Platform — Agent Instructions

## Project Structure

This is a monorepo containing Deepdub's platform services:

- `projects/deepdub-rest-api` — Go REST API for TTS, voice management, infrastructure
- `projects/stream-generation-eks` — WebSocket streaming TTS service
- `projects/gender-detection` — Python FastAPI gender classification from audio
- `projects/qc_management` — Quality control management service
- `libs/` — Shared Python libraries
- `tools/` — Migration scripts and utilities

## Deepdub API Reference

### Base URLs

| Region | URL |
|--------|-----|
| US (default) | `https://restapi.deepdub.ai/api/v1` |
| EU | `https://eu-restapi.deepdub.ai/api/v1` |
| WebSocket | `wss://wsapi.deepdub.ai/ws` |

### Authentication

All requests require `x-api-key` header. Key format: `dd-{random}{checksum}`.

Free trial key (rate-limited by IP): `dd-00000000000000000000000065c9cbfe`

Store production keys in a secrets manager, never in code.

### Default Model

`dd-etts-3.0` — always use this unless specified otherwise.

### REST Endpoints

#### POST /tts — Generate TTS audio

Returns audio stream (MP3 by default).

```json
{
  "model": "dd-etts-3.0",
  "targetText": "Hello world",
  "locale": "en-US",
  "voicePromptId": "bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773"
}
```

Optional fields: `generationId`, `targetDuration`, `tempo` (0.5–2.0), `variance` (0.0–1.0), `seed`, `temperature` (0.0–1.0), `sampleRate` (8000/16000/22050/24000/32000/36000/44100/48000), `format` (mp3/opus/mulaw/wav), `promptBoost`, `superStretch`, `realtime`, `cleanAudio`, `autoGain`, `publish`, `voiceReference` (base64 for instant cloning), `accentControl` (`accentBaseLocale`, `accentLocale`, `accentRatio` 0.0–1.0), `performanceReferencePromptId`.

#### Voice endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /voice | List voice prompts (`?limit=N`) |
| POST | /voice | Upload voice sample (base64, max 20 MB) |
| PUT | /voice | Update voice prompt metadata |
| GET | /voice/{prompt_id} | Get voice prompt by ID |
| DELETE | /voice/{prompt_id} | Delete voice prompt |

#### POST /gender-detection/classify

Classify speaker gender. Send `audio_url` or `audio_base64`. Returns `{ "predicted_gender": "female", "confidence": 0.95 }`.

#### POST /gender-detection/classify/upload

Same but accepts multipart file upload.

### WebSocket API

Connect to `wss://wsapi.deepdub.ai/ws` with `x-api-key` header.

```json
{
  "action": "generate",
  "model": "dd-etts-3.0",
  "targetText": "Hello",
  "locale": "en-US",
  "voicePromptId": "..."
}
```

Response: chunked `{ "audio": "<base64>", "isFinished": false }` ... `{ "isFinished": true }`.

### Error Responses

All errors return `{ "success": false, "message": "..." }`.

| Code | Meaning |
|------|---------|
| 400 | Invalid or missing parameters |
| 401 | Invalid or missing API key |
| 402 | Insufficient credits |
| 403 | Limit reached (e.g., voice prompt limit) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

Rate limits: 5 concurrent per customer, 3 concurrent per IP.

---

## Python SDK

```bash
pip install deepdub
```

```python
from deepdub import DeepdubClient

client = DeepdubClient(api_key="YOUR_KEY")

audio = client.tts(
    text="Hello world",
    voice_prompt_id="bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773",
    model="dd-etts-3.0",
    locale="en-US",
)

with open("output.mp3", "wb") as f:
    f.write(audio)
```

Key methods: `client.tts()`, `client.classify_gender()`, `client.list_voices()`, `client.add_voice()`, `client.delete_voice()`.

Async streaming:

```python
async with client.async_connect() as conn:
    async for chunk in conn.async_tts(text="...", voice_prompt_id="...", model="dd-etts-3.0", format="mp3"):
        audio.extend(chunk)
```

Env var: `DEEPDUB_API_KEY`.

## JavaScript SDK

```bash
npm install @deepdub/node
```

```javascript
const { DeepdubClient } = require("@deepdub/node");

const deepdub = new DeepdubClient("YOUR_KEY");
await deepdub.connect();

const buffer = await deepdub.generateToBuffer("Hello world", {
  locale: "en-US",
  voicePromptId: "bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773",
  model: "dd-etts-3.0",
});

await deepdub.generateToFile("./output.wav", "Hello world", { ... });
```

HTTP mode for REST calls: `new DeepdubClient("KEY", { protocol: "http" })`, then `.get("/voice")`, `.post("/voice", { json: {...} })`.

Env var: `DEEPDUB_API_KEY`.

## Voice Presets (sample)

| Preset | Locale | Voice Prompt ID |
|--------|--------|-----------------|
| Storyteller (M) | en-US | `bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773` |
| Promo / Commercials (M) | en-US | `50a537cf-1ec8-4714-b07e-c589ab76be4b` |
| Meditation Guide (F) | en-US | `c0866c1c-0731-45b2-9c90-21be974513b4` |
| Sales Agent (F) | en-US | `02215cf5-04af-46f3-a061-48a4c81989bf` |
| News Broadcaster (M) | hi-IN | `731912b7-7e63-4de9-acf6-b16c4bdb0c9e_prompt-V2-Newscaster-Headlines` |
| Storyteller (F) | es-ES | `4202cbc4-5862-4af5-83f4-286ef487d593_reading-neutral` |

Full docs: https://docs.deepdub.app

## Coding Conventions

- Python: prefer `dict.get()` over `if key in dict`; use `logger.exception()` not `logger.error(f"...{e}")`; write module-level pytest tests, not class-based
- Store secrets in secrets manager, not env vars or code
- Default TTS model is always `dd-etts-3.0`
