---
name: Example Card
slug: example-card
status: active
created: 2026-05-24
tags: [profile, demo]
---

## Summary

Example Card fetches a user profile and renders it as a compact card with the person's name, email, and avatar initials. It demonstrates the simplest async-component pattern in the example app: one server action, three visible states (loading, error, success). It is a single-screen feature with no navigation.

## Feature definition

- **Goal**: Show a user's identity at a glance after an async fetch.
- **Primary actor**: Any viewer of a profile surface.
- **Entry points**: Atelier preview only (not routed).
- **In scope**: Fetching and displaying one profile; loading/error/success rendering.
- **Out of scope**: Editing the profile; authorization.

## Source files

### Components
- `components/ExampleCard.tsx`

### Actions
- `actions/user.ts` — `getUserProfile`

## Integrations with other features

- None — standalone demo component.

## Traceability checklist

- [ ] Summary claim: fetches a profile -> backed by `actions/user.ts` (`getUserProfile`)
- [ ] Summary claim: loading/error/success states -> backed by `.atelier/mocks/ExampleCard.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
