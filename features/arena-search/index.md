---
name: Arena Search
slug: arena-search
status: active
created: 2026-05-24
tags: [search, arena, demo]
---

## Summary

Arena Search lets a user search Are.na for blocks and channels, with debounced input, "load more" pagination, rate-limit handling, and error recovery. It is a rich single-screen feature whose many states (idle, loading, empty, success, load-more, rate-limited, error) are all driven by two hooks.

## Feature definition

- **Goal**: Find Are.na blocks and channels by query.
- **Primary actor**: Any researcher browsing Are.na content.
- **Entry points**: Atelier preview only (not routed).
- **In scope**: Query input, result rendering, load-more, rate-limit + error states.
- **Out of scope**: Block detail; related-block suggestions (see `related-blocks`).

## Source files

### Components
- `components/ExampleSearchTab/index.tsx`
- `components/ExampleSearchTab/components/SearchInput.tsx`
- `components/ExampleSearchTab/components/SearchResults.tsx`
- `components/ExampleSearchTab/components/SearchSkeleton.tsx`
- `components/ExampleSearchTab/components/ArenaEmptyState.tsx`
- `components/ExampleSearchTab/components/BlockItem.tsx`
- `components/ExampleSearchTab/components/ChannelItem.tsx`

### Hooks
- `hooks/useArenaSearch.ts`
- `hooks/useRateLimit.ts`

## Integrations with other features

- `related-blocks` — adjacent Are.na surface; no shared state.

## Traceability checklist

- [ ] Summary claim: search blocks + channels -> backed by `hooks/useArenaSearch.ts`
- [ ] Summary claim: rate-limit handling -> backed by `hooks/useRateLimit.ts`
- [ ] Summary claim: idle/loading/empty/success/load-more/error -> backed by `.atelier/mocks/ExampleSearchTab.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
