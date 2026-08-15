# Conventions

Dev preferences and the rules agents must follow in this repo.

## Documentation: strict, short, scannable

Docs exist so devs actually read them and agents spend few tokens. Hard size budgets:

| File | Budget | Shape |
|------|--------|-------|
| `docs/*.md` | ≤ 60 lines | Orientation notes, tables over prose. |
| `features/<slug>/index.md` | ≤ 40 lines | Front-matter + short sections. |
| `features/<slug>/flow.md` | ≤ 30 lines | One Mermaid diagram + numbered legend. |
| `features/<slug>/frames.md` | ≤ 15 lines | Path list only. |
| `features/<slug>/scenes.md` | ≤ 15 lines | Path list only. |

Prefer bullets and tables. Never restate code in prose. If a file wants to grow past budget, split the feature instead of bloating the file.

## Frames & scenes

- Frames live in `.atelier/mocks/*.frame.tsx` (single canonical location).
- A scene `outcome.frame` must differ from the node's own `frame` (outcomes are frame transitions). Intra-frame states use the StateBar — single-screen features get a `scenes.md` placeholder, not a scene.
- Primary actions / form submits use `@/components/ui/Button` so they join the scene outcome dropdown automatically.
- Variants are only cross-cutting global axes (declared in `.atelier/variants.ts`). Page-local state is a frame `state`, never a variant.

## Mocks

- Mock only the actions/hooks used by components that have frames.
- Mocks import types from the real `*.types.ts`; exported name + signature match the real function.
- Keep mocks logic-less: a setter installs the impl, the export delegates to it.

## Code

- TypeScript strict; no `any` at boundaries.
- Don't add comments/docstrings to code you didn't change.
- Reversible local actions freely; confirm before destructive or shared-system actions.

## Workflow routing

- New feature / changed flow → `feature-analyst` skill (then `scene-coverage` for any scenes).
- Bug fix → `bugfix` skill (writes a `qa/pending/` case).
- Scene created/modified → `scene-coverage` skill.
- Append `--no-workflow` to a request to skip automatic skill/doc steps.
