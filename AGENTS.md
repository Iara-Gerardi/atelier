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

export interface RenderContext<TKeys extends VariantKey = VariantKey> {
  variants: Pick<VariantValues, TKeys>
}

export interface ComponentState<TKeys extends VariantKey = never> {
  render: (ctx: RenderContext<TKeys>) => ReactNode
  description?: string
}

export interface MockMeta<TKeys extends VariantKey = never> {
  name: string
  category: string
  tags?: string[]
  variants?: readonly TKeys[]
}

export interface RegistryEntry extends MockMeta {
  states: Record<StateKey, ComponentState>
}

export interface Outcome {
  id: string
  frame: string           // required AND must differ from the node's frame
  state: StateKey         // initial state on the target frame
  description: string     // required — surfaces as dropdown subtitle + qa text
  default?: boolean       // primary face of the split-button (one per node)
  set?: PartialVariants   // variant flips applied on dispatch
}

export interface SceneNode {
  frame: string
  state: StateKey
  outcomes?: Outcome[]
  gate?: (ctx: RenderContext) => boolean   // evaluated on every render
  fallback?: string                        // node id; required when gate is set
}

export interface SceneDef { initial: string; nodes: Record<string, SceneNode> }
```

---

## Scenes & Variants

Atelier has two extra concepts that build on top of frames:

- **Variants** — a central, typed registry of **cross-cutting global axes** (e.g. `auth: 'guest' | 'student' | 'professor' | 'admin'`) declared once in `.atelier/variants.ts`. Each axis carries a label + description, and each value carries label + description metadata so agents and the variant-bar tooltip can pick values intelligently. Page-local state (cart contents, form status, modal open, pagination, …) is **not** a variant — it belongs as a frame `state`. Frames opt into the axes they care about via `meta.variants: ['auth'] as const`, and their `render({ variants })` receives the typed values. The variant bar is scoped: it only shows axes the current frame (or any frame reachable in the current scene) opts into.

- **Scenes** — flows that live in `.atelier/scenes/*.scene.tsx`. A scene declares `initial` + `nodes`, where each node points at an existing `(frame, state)` and may declare `outcomes` (declarative "what could the user do here?") and `gate` + `fallback` (access control). Scenes are auto-discovered — do not register them manually.

- **Outcomes are *frame transitions only*.** An outcome is `{ id, frame, state, description, default?, set? }` where `frame` **must point at a different frame than the node's own** — same-frame state navigation belongs on the **StateBar** that sits above the canvas, not on the dropdown. The mocked `@/components/ui/Button` (see below) reads the node's outcomes and renders a split-button labelled "Go to <outcome.id>"; the primary face fires the outcome with `default: true`. After dispatch, the user is "downstream": the rendered frame and state are determined by the outcome (and may then be re-navigated via the StateBar without going back through the dropdown).

- **StateBar vs. outcome dropdown.** The StateBar previews any of the *current rendered frame's* declared states. The outcome dropdown lists only the states that are *reachable as outcomes* from the entry node — typically a strict subset of the target frame's states. If a frame has a state that the real feature never reaches from this node, leave it out of `outcomes`; users can still preview it via the StateBar.

- **Gate + fallback** is the only way to change nodes in scene mode. `gate({ variants })` runs every render of the node; when it returns false, `SceneCanvas` renders the `fallback` node's frame inline (the URL keeps the user's intended `node` so flipping a variant immediately swings the render back). Use gates for access control only.

- **Mocked Button** — `.atelier/mocks/components/ui/Button.tsx` is Vite-aliased over `@/components/ui/Button` (the same trick used for action/hook mocks). In standalone frame mode it re-exports the real Button; in scene mode it becomes the scene-aware split dropdown. **This means a component participates in scenes purely by importing `@/components/ui/Button`** — no per-frame wrapping. Use the Button primitive instead of inline `<button>` for primary actions and form submits.

When adding a frame that should react to a variant axis: (1) declare it in `meta.variants`, (2) destructure `({ variants })` in `render`, (3) include the axis value in the React `key` so the frame remounts when it changes (mocks like `setGetProducts` only run on render).

**Scenes are the spec qa cases derive from.** Whenever a scene file is created or modified, **load the `scene-coverage` skill** (`.github/skills/scene-coverage/SKILL.md`) and run it against the changed scene. It translates each node-arrival and each outcome dispatch (per relevant variant assignment) into a case under `qa/pending/`, which the `qa-agent` then runs. The skill is idempotent — running it again after a no-op change emits zero new files. This is the single mechanism for scene → qa generation; `bugfix` and `feature-analyst` both delegate to it rather than writing scene-derived cases by hand.

---

## Feature documentation

When a new feature is built or an existing feature's functional requirements / user flow changes, **load the `feature-analyst` skill** (`.github/skills/feature-analyst/SKILL.md`) before writing any feature docs. The skill instructs you to create or update the four documentation files in `features/<slug>/` (`index.md`, `flow.md`, `frames.md`, `scenes.md`) and to invoke `scene-coverage` for any scenes listed in `scenes.md`.

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
- [ ] If the frame's behavior depends on a global variant axis (auth, locale, theme, …), declare `meta.variants: [...] as const` and consume them via `({ variants }) => …`
- [ ] Primary actions and form submits use `@/components/ui/Button` (not inline `<button>`) so they participate in the scene's outcome dropdown automatically
- [ ] If the component participates in a multi-screen user flow, a scene under `.atelier/scenes/` references its frame and the relevant `features/<slug>/scenes.md` lists that scene
- [ ] If a scene node should be inaccessible under certain variant values, it declares a `gate` paired with a `fallback` node id
- [ ] After any scene change, the `scene-coverage` skill has been run against the affected scene (cases live under `qa/pending/`)
