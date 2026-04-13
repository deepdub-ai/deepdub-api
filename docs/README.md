# Deepdub API Documentation

Developer documentation for [Deepdub](https://deepdub.com) voice AI APIs. Built with [Mintlify](https://mintlify.com).

**Docs site:** [docs.deepdub.com](https://docs.deepdub.com)

## APIs

| API | Protocol | Description |
|-----|----------|-------------|
| [REST TTS](/api-reference/tts/generate-and-stream-tts-audio) | HTTP POST | Stream generated audio as a chunked HTTP response |
| [WebSocket TTS](/api-reference/websocket/overview) | WebSocket | Stream audio chunks in real-time for low-latency playback |
| [Gender Detection](/api-reference/gender-detection/classify-speaker-gender) | HTTP POST | Classify speaker gender from audio |
| [Voice Management](/api-reference/voice/get-voice-prompts) | HTTP REST | Upload, list, update, and delete voice prompts |

## Supported output formats

| Format | REST API | WebSocket | WebSocket streaming input (ctx/isFinal) |
|--------|----------|-----------|------------------------------------------|
| `mp3` | Yes (**default**) | Yes | No |
| `opus` | Yes | Yes | No |
| `mulaw` | Yes | Yes | Yes |
| `wav` | No | Yes (**default**) | Yes |
| `s16le` | No | Yes | Yes |

> **Note:** The REST API only supports `mp3`, `opus`, and `mulaw`. For `wav` or `s16le` output, use the WebSocket API.

## Sample rates

The internal generation runs at 48 kHz and is resampled to the requested rate. If no sample rate is specified, `mulaw` defaults to 8000 Hz.

## SDKs

| SDK | Install | Docs |
|-----|---------|------|
| Python | `pip install deepdub` | [Python SDK](/sdk) |
| JavaScript / Node.js | `npm install @deepdub/node` | [JavaScript SDK](/sdk-javascript) |

## Free trial

Use the free trial API key to get started — no sign-up required:

```
dd-00000000000000000000000065c9cbfe
```

## Local development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview docs locally:

```bash
npm i -g mintlify
mintlify dev
```

Changes pushed to `main` are deployed automatically.
