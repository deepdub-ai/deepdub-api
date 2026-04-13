---
name: deepdub-api
description: Deepdub Text-to-Speech API reference for building TTS integrations. Use when the user writes code that calls the Deepdub API, uses the Deepdub Python/JS SDK, generates speech, manages voices, classifies gender, or mentions deepdub, TTS, text-to-speech, or voice cloning.
---

# Deepdub API

## Base URLs

| Region | URL |
|--------|-----|
| US (default) | `https://restapi.deepdub.ai/api/v1` |
| EU | `https://eu-restapi.deepdub.ai/api/v1` |
| WebSocket | `wss://wsapi.deepdub.ai/ws` |

## Authentication

All requests require `x-api-key` header. Key format: `dd-{random}{checksum}`.

Free trial key (rate-limited by IP): `dd-00000000000000000000000065c9cbfe`

Store production keys in a secrets manager, never in code.

## Default Model

`dd-etts-3.0` — always use this unless the user specifies otherwise.

---

## REST API Endpoints

### POST /tts — Generate TTS audio

Returns audio stream (MP3 by default).

```json
{
  "model": "dd-etts-3.0",
  "targetText": "Hello world",
  "locale": "en-US",
  "voicePromptId": "bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773"
}
```

**Optional fields:** `generationId`, `targetDuration`, `tempo` (0.5–2.0), `variance` (0.0–1.0), `seed`, `temperature` (0.0–1.0), `sampleRate` (8000/16000/22050/24000/32000/36000/44100/48000), `format` (mp3/opus/mulaw/wav), `promptBoost`, `superStretch`, `realtime`, `cleanAudio`, `autoGain`, `publish`, `voiceReference` (base64 audio for instant cloning), `accentControl` (`accentBaseLocale`, `accentLocale`, `accentRatio` 0.0–1.0), `performanceReferencePromptId`.

### Voice endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /voice | List voice prompts (optional `?limit=N`) |
| POST | /voice | Upload voice sample (base64, max 20 MB) |
| PUT | /voice | Update voice prompt metadata |
| GET | /voice/{prompt_id} | Get voice prompt by ID |
| DELETE | /voice/{prompt_id} | Delete voice prompt |

### POST /gender-detection/classify

Classify speaker gender from audio. Send `audio_url` or `audio_base64`.

Returns: `{ "predicted_gender": "female", "confidence": 0.95 }`

### POST /gender-detection/classify/upload

Same as above, but accepts multipart file upload.

---

## Python SDK

```bash
pip install deepdub
```

### Synchronous TTS

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

### Async streaming

```python
import asyncio

async def stream():
    async with client.async_connect() as conn:
        audio = bytearray()
        async for chunk in conn.async_tts(
            text="Streaming audio",
            voice_prompt_id="...",
            model="dd-etts-3.0",
            format="mp3",
        ):
            audio.extend(chunk)
    with open("streamed.mp3", "wb") as f:
        f.write(audio)

asyncio.run(stream())
```

### Other SDK methods

- `client.tts(...)` — sync TTS, returns bytes
- `client.retroactive_tts(...)` — async generation, returns URL
- `client.classify_gender(data=Path("audio.wav"))` — gender detection
- `client.list_voices()` — list voice prompts
- `client.add_voice(data=Path("sample.wav"), name="...", gender="female", locale="en-US")` — upload voice
- `client.delete_voice(voice_prompt_id="...")` — delete voice

Env var: `DEEPDUB_API_KEY` (used if `api_key` not passed to constructor).

---

## JavaScript SDK

```bash
npm install @deepdub/node
```

### WebSocket (default, streaming)

```javascript
const { DeepdubClient } = require("@deepdub/node");

const deepdub = new DeepdubClient("YOUR_KEY");
await deepdub.connect();

const buffer = await deepdub.generateToBuffer("Hello world", {
  locale: "en-US",
  voicePromptId: "bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773",
  model: "dd-etts-3.0",
});

// Or write directly to file
await deepdub.generateToFile("./output.wav", "Hello world", { ... });
```

### Streaming chunks

```javascript
const buffer = await deepdub.generateToBuffer("Hello", {
  locale: "en-US",
  voicePromptId: "...",
  model: "dd-etts-3.0",
  onChunk: (chunk) => console.log(`Received ${chunk.length} bytes`),
  headerless: true, // raw PCM without WAV header
});
```

### HTTP protocol (for REST endpoints like /voice)

```javascript
const deepdub = new DeepdubClient("YOUR_KEY", { protocol: "http" });
const voices = await deepdub.get("/voice");
const result = await deepdub.post("/voice", { json: { ... } });
```

Env var: `DEEPDUB_API_KEY`.

---

## WebSocket API (raw)

Connect to `wss://wsapi.deepdub.ai/ws` with header `x-api-key`.

Send JSON message, receive chunked audio:

```json
{
  "action": "generate",
  "model": "dd-etts-3.0",
  "targetText": "Hello",
  "locale": "en-US",
  "voicePromptId": "..."
}
```

Response chunks: `{ "audio": "<base64>", "isFinished": false }` ... `{ "isFinished": true }`

---

## Error Responses

REST errors return JSON with `{ "success": false, "message": "..." }`.

| Code | Meaning |
|------|---------|
| 400 | Invalid or missing parameters |
| 401 | Invalid or missing API key |
| 402 | Insufficient credits |
| 403 | Limit reached (e.g., voice prompt limit) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Rate limits

| Limit | Default |
|-------|---------|
| Concurrent requests per customer | 5 |
| Concurrent requests per IP | 3 |

---

## Voice Presets (sample)

For the full voice presets list with IDs, see the [docs voice-presets page](../../../deepdub-docs/voice-presets.mdx) or the live documentation.

Common presets for quick testing:

| Preset | Locale | Voice Prompt ID |
|--------|--------|-----------------|
| Storyteller (M) | en-US | `bd1b00bb-be1c-4679-8eaa-0fcbfd4ff773` |
| Promo / Commercials (M) | en-US | `50a537cf-1ec8-4714-b07e-c589ab76be4b` |
| Meditation Guide (F) | en-US | `c0866c1c-0731-45b2-9c90-21be974513b4` |
| Sales Agent (F) | en-US | `02215cf5-04af-46f3-a061-48a4c81989bf` |
| News Broadcaster (M) | hi-IN | `731912b7-7e63-4de9-acf6-b16c4bdb0c9e_prompt-V2-Newscaster-Headlines` |
| Storyteller (F) | es-ES | `4202cbc4-5862-4af5-83f4-286ef487d593_reading-neutral` |

---

## Full API Reference

For complete OpenAPI spec, parameter details, and interactive docs:
- Local: `~/src/deepdub-docs/openapi3.json`
- Live: https://docs.deepdub.app
