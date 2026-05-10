# Atelier — Agent Instructions

## What Atelier is

Atelier is a component preview workbench. Every component in `components/` must have a corresponding mock file in `preview/mocks/`. The registry is assembled automatically — no manual registration is needed.

**For detailed patterns, load the `atelier` skill** (`.github/skills/atelier/SKILL.md`).

---

## Registry mechanism

`vite.preview.config.ts` scans `preview/mocks/*.mock.tsx` at dev-server start and builds a `virtual:preview-registry` module on the fly. Each mock file is the single source of truth for both its visual states and its registry metadata.

The type contract lives in `registry/types.ts`:

```ts
export type StateKey = string

export interface ComponentState {
  render: () => ReactNode
  description?: string
}

export interface MockMeta {
  name: string
  category: string
  tags?: string[]
}

export interface RegistryEntry extends MockMeta {
  states: Record<StateKey, ComponentState>
}
```

---

## Bug fixing

When the user reports a bug or asks you to fix broken behavior, **load the `bugfix` skill** (`.github/skills/bugfix/SKILL.md`) before proceeding. The skill instructs you to write a case file to `qa/pending/` immediately after every fix.

For QA test runs, invoke the `qa-agent` (`.github/agents/qa-agent.agent.md`).

---

## Checklist for any new component

- [ ] Component created in `components/` — follow folder/nesting rules in the skill's `app-architecture.md`
- [ ] Mock file created at `preview/mocks/<ComponentName>.mock.tsx` with `meta` export + default states
- [ ] If component uses a server action: mock interceptor created in `preview/mocks/actions/`
- [ ] If component uses a hook: mock interceptor created in `preview/mocks/hooks/` + path added to `preview/tsconfig.json`
- [ ] States cover: loading, error, success, and any meaningful interaction variants
