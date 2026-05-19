---
name: atelier
description: "Use when: creating, modifying, or previewing components in this Atelier workspace. Covers mock file creation, dependency interception, component folder structure, nesting rules, and preview registry patterns."
---

# Atelier

Atelier is a component preview workbench. Every component in `components/` must have a corresponding frame file (`*.frame.tsx`) in `.atelier/mocks/`. The registry is assembled automatically — no manual registration is needed.

## Registry mechanism

`.atelier/registry/index.ts` uses `import.meta.glob` to auto-discover all `*.frame.tsx` files at Vite startup. Each frame file exports a `meta` named export (name, category, tags) and a default export of states. No virtual module, no Vite plugin, no manual registration.

## Reference files

Load these for detailed patterns before writing any code:

| Topic | File |
|-------|------|
| Frame file creation, states, dependency interception | [mock-creation.md](./references/mock-creation.md) |
| Folder structure, nesting rules, component anatomy | [app-architecture.md](./references/app-architecture.md) |
| Scenes, outcomes, gate/fallback, the mocked `@/components/ui/Button` and the global variant registry | [scenes-and-variants.md](./references/scenes-and-variants.md) |

## Checklist for any new component

- [ ] Component created in `components/` — follow folder/nesting rules in [app-architecture.md](./references/app-architecture.md)
- [ ] Frame file created at `.atelier/mocks/<ComponentName>.frame.tsx` with `meta` export + default states
- [ ] If component uses a server action: mock interceptor created in `.atelier/mocks/actions/`
- [ ] If component uses a hook: mock interceptor created in `.atelier/mocks/hooks/` + path added to `.atelier/tsconfig.json`
- [ ] States cover: loading, error, success, and any meaningful interaction variants
- [ ] If the component reacts to a global variant axis (e.g. `auth`), declare it in `meta.variants` and consume `({ variants })` in `render`
- [ ] If the component participates in a multi-screen user flow, a scene under `.atelier/scenes/` references its frame — see [scenes-and-variants.md](./references/scenes-and-variants.md)
- [ ] If a scene node should be inaccessible under certain variant values, declare a `gate` paired with a `fallback` node id — see [scenes-and-variants.md](./references/scenes-and-variants.md)
