---
id: project-graph-and-render-evidence
created: 2026-11-06
severity: medium
status: ready_for_promotion
---

## What this case verifies

Directed feature usages, dependency invalidation and per-execution branch evidence are consistent with the compact feature contract. This is a tooling case, not a scene-derived case.

## How to reproduce

1. Run `npm run test:graph` and `npm run atelier:scan`.
2. Inspect `.atelier/generated/features.json` for shared frames and evidence paths.
3. Run `npm run atelier:coverage -- --plan qa/coverage/frame-smoke.json` with Playwright Chromium installed.
4. Inspect `.atelier/coverage/` and `.atelier/generated/report.json`.

## What the agent should check

- [ ] Feature membership follows declared entries and runtime references, without propagating across unused imports or type imports.
- [ ] A frame can carry more than one feature usage, each with a source path.
- [ ] Removing a source dependency still identifies its prior dependent frames, scenes and mocks.
- [ ] Read-only scan mode does not advance the baseline.
- [ ] Jev candidate reviews are reused until the dependency/model/question fingerprint changes.
- [ ] Catalog bootstrap refuses to replace existing feature contracts.
- [ ] Render instrumentation evaluates a predicate once and returns its original value.
- [ ] Each coverage execution starts a fresh browser context and records frame, state and variants.
- [ ] A receipt distinguishes executed branches from passed visible assertions.
- [ ] Changed dependencies invalidate stored coverage, while unrelated files do not.
- [ ] The documented three-run smoke plan produces asserted receipts when its visible conditions hold.
- [ ] The feature workflow maintains one contract and does not require redundant flow/frame/scene documents.
