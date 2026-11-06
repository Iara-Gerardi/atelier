# Conventions

Dev preferences and the rules agents must follow in this repo.

## Documentation: strict, short, scannable

Docs exist so devs actually read them and agents spend few tokens. Hard size budgets:

| File | Budget | Shape |
|------|--------|-------|
| `docs/*.md` | ≤ 60 lines | Orientation notes, tables over prose. |
| `features/<slug>/index.md` | Usually ≤ 20 lines | Feature contract + optional brief scope paragraph. |

Prefer bullets and tables. Never restate code in prose. Feature boundaries follow distinct goals, not document length. Keep only intent and entry points in the catalog; derive frame usage and dependencies from the graph.

## Frames & scenes

- Frames live in `.atelier/mocks/*.frame.tsx` (single canonical location).
- A scene `outcome.frame` must differ from the node's own `frame` (outcomes are frame transitions). Intra-frame states use the StateBar; omit `scenes` from a single-screen feature contract when no scene is needed.
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

- New feature / changed flow → `feature-analyst` skill; maintain `features/<slug>/index.md` and run `npm run atelier:scan`. Use `scene-coverage` for new or behaviorally changed scenes.
- Initial catalog discovery runs once via `npm run atelier:catalog`; subsequent features are documented incrementally. Review unresolved entries and stale coverage instead of relabeling unrelated features.
- Bug fix → `bugfix` skill (writes a `qa/pending/` case).
- Scene created/modified → `scene-coverage` skill.
- Append `--no-workflow` to a request to skip automatic skill/doc steps.
