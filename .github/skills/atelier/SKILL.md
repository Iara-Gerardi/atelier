---
name: atelier
description: "Use when: creating, modifying, or previewing components in this Atelier workspace. Covers mock file creation, dependency interception, component folder structure, nesting rules, and preview registry patterns."
---

# Atelier

Atelier is a component preview workbench. Every component in `components/` must have a corresponding mock file in `preview/mocks/`. The registry is assembled automatically — no manual registration is needed.

## Registry mechanism

`vite.preview.config.ts` scans `preview/mocks/*.mock.tsx` at dev-server start and builds a `virtual:preview-registry` module from each file's `meta` named export and default states export.

## Reference files

Load these for detailed patterns before writing any code:

| Topic | File |
|-------|------|
| Mock creation, states, dependency interception | [mock-creation.md](./references/mock-creation.md) |
| Folder structure, nesting rules, component anatomy | [app-architecture.md](./references/app-architecture.md) |

## Checklist for any new component

- [ ] Component created in `components/` — follow folder/nesting rules in [app-architecture.md](./references/app-architecture.md)
- [ ] Mock file created at `preview/mocks/<ComponentName>.mock.tsx` with `meta` export + default states
- [ ] If component uses a server action: mock interceptor created in `preview/mocks/actions/`
- [ ] If component uses a hook: mock interceptor created in `preview/mocks/hooks/` + path added to `preview/tsconfig.json`
- [ ] States cover: loading, error, success, and any meaningful interaction variants
