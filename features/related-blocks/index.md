---
name: Related Blocks
slug: related-blocks
status: active
created: 2026-05-24
tags: [arena, ai, demo]
---

## Summary

Related Blocks generates a grid of AI-suggested Are.na blocks related to a source block, with refresh and error retry. A single hook drives its idle, loading, empty, success, rate-limited, and error states on one screen.

## Feature definition

- **Goal**: Surface AI-suggested blocks related to a given block.
- **Primary actor**: Any researcher exploring connections.
- **Entry points**: Atelier preview only (not routed).
- **In scope**: Generating suggestions, rendering the grid, refresh, error/rate-limit recovery.
- **Out of scope**: Free-text search (see `arena-search`).

## Source files

### Components
- `components/ExampleRelatedBlocks.tsx`

### Hooks
- `hooks/useRelatedBlocks.ts`

## Integrations with other features

- `arena-search` — adjacent Are.na surface; no shared state.

## Traceability checklist

- [ ] Summary claim: AI-suggested related blocks -> backed by `hooks/useRelatedBlocks.ts`
- [ ] Summary claim: refresh + error retry -> backed by `components/ExampleRelatedBlocks.tsx`
- [ ] Summary claim: idle/loading/empty/success/rate-limited/error -> backed by `.atelier/mocks/ExampleRelatedBlocks.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
