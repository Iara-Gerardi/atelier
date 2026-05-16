# Atelier — Agent Instructions

## What Atelier is

Atelier is a component preview workbench. Every component in `components/` must have a corresponding frame file (`*.frame.tsx`) in `.atelier/mocks/`. The registry is assembled automatically — no manual registration is needed.

**For detailed patterns, load the `atelier` skill** (`.github/skills/atelier/SKILL.md`).

> **Skip workflows:** If the user's message includes `--no-workflow`, skip all automatic skill loading and documentation steps for that request.

---

## Registry mechanism

`.atelier/registry/index.ts` uses `import.meta.glob` to auto-discover all `*.frame.tsx` files at Vite startup. Each frame file is the single source of truth for both its visual states and its registry metadata.

The type contract lives in `.atelier/registry/types.ts`:

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

## Feature documentation

When a new feature is built or an existing feature's functional requirements / user flow changes, **load the `feature-analyst` skill** (`.github/skills/feature-analyst/SKILL.md`) before writing any feature docs. The skill instructs you to create or update the three documentation files in `features/<slug>/`.

**Do not load this skill for:** bugfixes that do not alter user-facing behavior, style or refactor changes, or adding Atelier frame states for behavior that already existed.

---

## Bug fixing

When the user reports a bug or asks you to fix broken behavior, **load the `bugfix` skill** (`.github/skills/bugfix/SKILL.md`) before proceeding. The skill instructs you to write a case file to `qa/pending/` immediately after every fix.

For QA test runs, invoke the `qa-agent` (`.github/agents/qa-agent.agent.md`).

---

## Checklist for any new component

- [ ] Component created in `components/` — follow folder/nesting rules in the skill's `app-architecture.md`
- [ ] Frame file created at `.atelier/mocks/<ComponentName>.frame.tsx` with `meta` export + default states
- [ ] If component uses a server action: mock interceptor created in `.atelier/mocks/actions/`
- [ ] If component uses a hook: mock interceptor created in `.atelier/mocks/hooks/` + path added to `.atelier/tsconfig.json`
- [ ] States cover: loading, error, success, and any meaningful interaction variants
