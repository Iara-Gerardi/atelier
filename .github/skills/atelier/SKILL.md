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
- [ ] If component uses a server action: mock created in `.atelier/mocks/actions/` — exports `meta.states` const array, `MockState` type derived from it, setter takes `MockState` as only arg, fixture data lives inside the mock file
- [ ] If component uses a hook: same pattern in `.atelier/mocks/hooks/` + path added to `.atelier/tsconfig.json`
- [ ] Mock only covers actions/hooks used by a component that has a frame — not every export in the codebase
- [ ] Mock imports types from `.types.ts` only — never from the real implementation file
- [ ] Mock's exported function name and signature match the real action/hook so the Vite alias is transparent
- [ ] States describe reachable, meaningfully different renders or interactions. Use render-branch evidence to find gaps; branches and state keys are not one-to-one. Run `npm run atelier:coverage` for execution evidence and add assertions for expected visible results.
- [ ] Frame file contains only `meta` and `states` — no helper functions, no constants, no additional exports
- [ ] Render functions are logic-less: only setter calls + JSX return; any logic variation that changes the UI is a separate state
- [ ] If the component reacts to a global variant axis (e.g. `auth`), declare it in `meta.variants` and consume `({ variants })` in `render`
- [ ] If the component participates in a multi-screen user flow, a scene under `.atelier/scenes/` references its frame — see [scenes-and-variants.md](./references/scenes-and-variants.md)
- [ ] If a scene node should be inaccessible under certain variant values, declare a `gate` paired with a `fallback` node id — see [scenes-and-variants.md](./references/scenes-and-variants.md)
