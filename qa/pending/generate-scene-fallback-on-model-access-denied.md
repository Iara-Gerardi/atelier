---
id: generate-scene-fallback-on-model-access-denied
created: 2026-05-24
fixed_in: ai/tools/frame-generator/fallback.ts
trigger: shouldUseTemplateFallback only matched missing-key / quota / 401 / 403 / 429 errors, not subscription-tier model-access denials
severity: medium
status: pending_verification
---

## What broke
On AI plans where the configured model is not accessible (for example the Vercel AI Gateway free tier returning "Free tier users do not have access to this model"), both `gen-frame` and `gen-scene` aborted with an unhandled error instead of degrading to the deterministic template. This broke the portability goal that any developer can use Atelier regardless of subscription.

## How to reproduce (before fix)
1. Configure a model the active plan cannot access (default `openai/gpt-5.5` on a free gateway tier).
2. Run `npm run gen-scene --name SmokeFlow --entry-frame ExampleForm`.
3. Observe: command fails with `... do not have access to this model` and no scene is produced.

## What the agent should check
- [ ] `shouldUseTemplateFallback` returns true for model-access / subscription-tier errors (`do not have access`, `does not have access`, `model_not_found`, `Free tier`).
- [ ] `gen-scene` and `gen-frame` fall back to the deterministic template and still write a valid file when the model is inaccessible.
- [ ] Genuine non-recoverable errors (for example a malformed prompt build) still propagate instead of silently falling back.

## Fix summary
Extended `shouldUseTemplateFallback` in `frame-generator/fallback.ts` (re-exported by the scene generator) to also match model-access and subscription-tier denial messages. The scene generator's `run.ts` catch block now produces the minimal deterministic scene from the entry frame + first reachable second frame instead of throwing.
