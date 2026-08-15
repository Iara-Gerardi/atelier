# Vision

## Thesis

AI-assisted development makes traditional test suites hard to keep maintained — they rot faster than agents can fix them. Atelier offers a lighter alternative: a **living, agent-readable source of truth for UI states and workflows** that is cheap to create and easy to keep current. The same artifacts a developer browses to preview a component double as the ground truth an agent reads to build, document, and verify UI.

## What Atelier is

A **dev-only UI workbench** that runs alongside a Next.js app (in a separate Vite instance), letting developers preview components and workflows in isolation — without the backend stack, Playwright, or heavy mocking.

## The four pillars (definition of "done")

1. **Frames** — isolated component previews capturing distinct UI states (`loading`, `error`, `success`, …). Low-maintenance by design: the only mocks needed are for server actions and hooks, which stay nearly logic-less thanks to strong typing. Goal: zero cognitive load to add one.
2. **Scenes** — declarative representations of features/workflows, composed of frames. Action buttons that would trigger real logic are replaced by buttons that navigate to the next frame via declared **outcomes**, so you can walk a whole flow in pure UI terms.
3. **Agent testing** — frames and scenes double as a structured guide for AI agents. Specialized agents (QA, bugfix, feature analysis, frame/scene creators) use them as ground truth about how the UI should look and behave.
4. **Variants** — global axes (auth state, locale, …) that wrap frames and scenes without polluting them. Frames and scenes stay variant-agnostic; variants are a layer on top.

## Non-goals

- Not a production runtime, not a replacement for unit/integration tests of pure logic.
- Not a design tool — components render exactly as they ship.
- Frames do not encode page-local state as variants; variants are only cross-cutting global axes.

See [state.md](./state.md) for what is built and [conventions.md](./conventions.md) for how we work.
