---
name: Product List
slug: product-list
status: active
created: 2026-05-24
tags: [catalog, pagination, demo]
---

## Summary

Product List fetches a page of products and renders them as cards showing name and price, three per page, with previous/next pagination. It demonstrates paginated async data with loading, error, and success states on a single screen.

## Feature definition

- **Goal**: Browse products page by page.
- **Primary actor**: Any shopper.
- **Entry points**: Atelier preview only (not routed).
- **In scope**: Fetching a product page, rendering cards, page navigation.
- **Out of scope**: Product detail view; cart/checkout.

## Source files

### Components
- `components/ExampleProductList/index.tsx`
- `components/ExampleProductList/components/ProductCard.tsx`

### Actions
- `actions/product.ts` — `getProducts`

## Integrations with other features

- `home` — shares the `getProducts` action (home renders six per page in a grid).

## Traceability checklist

- [ ] Summary claim: paginated fetch (3/page) -> backed by `components/ExampleProductList/index.tsx`
- [ ] Summary claim: name + price cards -> backed by `components/ExampleProductList/components/ProductCard.tsx`
- [ ] Summary claim: loading/error/success -> backed by `.atelier/mocks/ExampleProductList.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
