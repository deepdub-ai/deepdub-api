# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is the public developer hub for the **Deepdub eTTS (Emotional Text-to-Speech) API**. It contains:
- Mintlify-powered documentation site (`docs/`)
- Python example scripts for REST and WebSocket API usage
- OpenAPI 3.0 specifications (`docs/openapi3.json`, `docs/managed-dub.openapi.json`)
- AI agent integration guides (`docs/skills/AGENTS.md`, `docs/skills/SKILL.md`)

This is **not** the platform monorepo — there is no build system, test suite, or CI/CD here. The actual platform services live in a separate monorepo.

## Documentation Site

The docs site at https://docs.deepdub.app is built with [Mintlify](https://mintlify.com). Configuration is in `docs/docs.json`. Pages are `.mdx` files in `docs/`. Changes to `main` auto-deploy.

## Running Example Scripts

```bash
pip install -r requirements.txt   # websockets, lxml, audiosample
python websocket-api-basic-example.py
python websocket-api-audio-description-example.py
```

Both scripts require a valid API key set in the script (or via `DEEPDUB_API_KEY` env var when using the SDK).

## API Essentials

- **Default model**: `dd-etts-3.0` — always use this unless specified otherwise
- **Auth**: `x-api-key` header, key format `dd-{random}{checksum}`
- **Free trial key**: `dd-00000000000000000000000065c9cbfe` (rate-limited by IP)
- **Base URLs** — every API runs in two regions; the EU host is the US host with `.eu` inserted before `.deepdub.ai`:
  - REST: `https://restapi.deepdub.ai/api/v1` / `https://restapi.eu.deepdub.ai/api/v1`
  - Streaming Out WebSocket: `wss://wsapi.deepdub.ai/open` / `wss://wsapi.eu.deepdub.ai/open`
  - Streaming In and Out WebSocket: `wss://wss.deepdub.ai/ws` / `wss://wss.eu.deepdub.ai/ws`
  - Managed Dub is US-only: `https://dubbing.deepdub.app`
- **Rate limits**: 5 concurrent per customer, 3 concurrent per IP

## Coding Conventions (from AGENTS.md)

- Python: prefer `dict.get()` over `if key in dict`
- Use `logger.exception()` not `logger.error(f"...{e}")`
- Write module-level pytest tests, not class-based
- Store secrets in a secrets manager, never in env vars or code

## Key Reference Files

- `docs/skills/AGENTS.md` — full API reference with all endpoints, SDK usage, voice presets, and coding conventions (intended for AI agents)
- `docs/skills/SKILL.md` — condensed API reference for Cursor/Claude skill integration
- `docs/openapi3.json` — complete OpenAPI 3.0 specification
- `README.md` — detailed API documentation with inline code examples
