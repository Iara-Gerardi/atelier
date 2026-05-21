---
id: generate-frame-env-key-loading
created: 2026-05-21
fixed_in: ai/tools/frame-generator/gateway.ts
trigger: CLI runner did not load project .env before resolving AI gateway credentials.
severity: high
status: pending_verification
---

## What broke
`npm run gen-frame` failed immediately with a missing `AI_GATEWAY_API_KEY` error even when the key existed in `.env`/`.env.local`.

## How to reproduce (before fix)
1. Set `AI_GATEWAY_API_KEY` only in `.env` (do not export it in the shell session).
2. Run `npm run gen-frame -- --src <ComponentName>`.
3. Observe: the command fails with "AI_GATEWAY_API_KEY is required to generate frames."

## What the agent should check
- [ ] `gen-frame` loads env vars from project `.env` without requiring manual shell export.
- [ ] When AI Gateway auth is unavailable, the script can still use `OPENAI_API_KEY`.
- [ ] Failures now reflect upstream auth/quota errors instead of false "missing key" errors.

## Fix summary
Updated `ai/tools/frame-generator/gateway.ts` to load project env files via `@next/env` before resolving credentials, and added a direct OpenAI Responses API fallback path when Gateway credentials are missing or rejected.
