---
name: Home
slug: home
status: active
created: 2026-05-24
tags: [landing, catalog, demo]
---

## Summary

Home is the app's landing page at `/`. It fetches products and lays them out in a paginated grid (six per page) using home cards. It is the only routed feature in the example app and renders loading, error, and success states on a single screen.

## Feature definition

- **Goal**: Greet visitors and surface a browsable product grid.
- **Primary actor**: Any visitor landing on `/`.
- **Entry points**: `app/page.tsx` (route `/`).
- **In scope**: Fetching products, grid layout, pagination, loading/error states.
- **Out of scope**: Product detail; search (see `arena-search`).

## Entry points / pages

- `app/page.tsx`
- `app/layout.tsx`

## Source files

### Components
- `components/HomePage/index.tsx`
- `components/HomePage/components/CardGrid.tsx`
- `components/HomePage/components/HomeCard.tsx`

### Actions
- `actions/product.ts` — `getProducts`

## Global variants

- `auth` — the landing adapts to the current `auth` role.

## Integrations with other features

- `product-list` — shares the `getProducts` action.

## Traceability checklist

- [ ] Summary claim: routed at `/` -> backed by `app/page.tsx`
- [ ] Summary claim: paginated grid (6/page) -> backed by `components/HomePage/index.tsx`
- [ ] Summary claim: loading/error/success -> backed by `.atelier/mocks/HomePage.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
