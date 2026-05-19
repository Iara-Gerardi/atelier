# Scenes & Variants (v3)

Frames preview a single component at one point in time. **Scenes** preview *flows* — the sequence of (frame, state) renders a user moves through — and **variants** model the cross-cutting global state every screen reacts to. Together they let an agent reason about a feature without ever running it.

This document is the reference for both. If something here contradicts a frame-level concern, the frame doc wins.

---

## Variants

### What is and isn't a variant

A variant is a **truly cross-cutting global axis** of application state. Good candidates:

- `auth` — user role / authentication status. Almost every page changes based on it.
- `locale` — language / region. Affects copy across the whole app.
- `theme` — light/dark/high-contrast. Affects every render.
- `featureFlag.*` — long-lived flags whose absence redefines large UI surfaces.

A variant is **not** the place for page-local state. The following do **not** belong here, they belong as `states` on individual frames:

- Cart contents on the checkout page (a property of `Checkout`, not the app).
- Form submission status (`idle`, `loading`, `success`, `error`).
- Modal open/closed.
- Items in a paginated list.

Rule of thumb: if only one page reads the axis, it should live as a frame state, not a variant.

### Registry shape

`.atelier/variants.ts` is the single source of truth. Each axis carries axis-level metadata and per-value metadata so agents can pick meaningful values:

```ts
export const variantAxes = {
  auth: {
    label: 'Auth',
    description: 'User role and authentication status. Gates which routes render and which UI actions appear.',
    values: [
      { value: 'guest',     label: 'Guest',     description: 'Not signed in. Most authenticated routes 404 or redirect to login.' },
      { value: 'student',   label: 'Student',   description: 'Signed-in student. Cannot access teacher/admin tools.' },
      { value: 'professor', label: 'Professor', description: 'Signed-in professor. Can manage student records.' },
      { value: 'admin',     label: 'Admin',     description: 'Full access to every route and action.' },
    ],
    default: 'guest',
  },
} as const satisfies Record<string, VariantAxis>
```

Adding an axis automatically:

- Surfaces it in the top-bar `VariantBar` (when at least one visible frame opts in via `meta.variants`).
- Adds it to the typed `VariantValues` map and `defaultVariants`.
- Makes it enumerable by the `scene-coverage` skill.

### Frames opt in

A frame declares which axes its render reads:

```ts
export const meta: MockMeta<'auth'> = {
  name: 'HomePage',
  category: 'Pages',
  variants: ['auth'] as const,
}

const states: Record<StateKey, ComponentState<'auth'>> = {
  success: {
    render: ({ variants }) => (
      <div key={`success-${variants.auth}`}>
        <AuthBanner auth={variants.auth} />
        <HomePage />
      </div>
    ),
  },
}
```

Three rules when opting in:

1. Declare the axis in `meta.variants` so the `VariantBar` shows in this frame.
2. Destructure `({ variants })` in `render` — the type already narrows to your declared subset.
3. Include each axis value in the React `key` so the frame remounts when it changes (mocks like `setGetProducts` only fire on render).

Frames that opt into no axes do not show the `VariantBar` at all in standalone mode.

---

## Scenes

A scene is a small typed graph of `nodes`. Each node renders a `(frame, state)` and may declare:

- `outcomes` — frame-to-frame transitions triggered by the primary user action on this screen.
- `gate` + `fallback` — access control; when the gate fails, the scene renders a fallback node's frame inline.

There is no transition graph in v3. Outcomes don't change the active node; they change the rendered `(frame, state)`. The only way to change nodes is the gate redirect (and the user picking a scene from the sidebar).

### Outcomes vs. the StateBar (important)

There are **two** state-navigation surfaces in scene mode and they own disjoint responsibilities:

| Surface | Owns | Scope |
|---------|------|-------|
| **Outcome dropdown** (mocked Button) | Frame-to-frame transitions | Lists the states of *other* frames that are reachable from this node as the result of the primary user action. `outcome.frame` **must differ from** the node's own frame. |
| **StateBar** (top of the canvas) | Intra-frame state preview | Lists every state declared by the *currently rendered* frame. Picking a state updates the render in place without changing the frame. |

Consequence: a target frame may have more states than there are outcomes pointing at it. Example — if `AddStudentStatus` has `success`, `error`, and `pending_review`, but only `success` and `error` are reachable from the form's submit, declare only those two as outcomes. After dispatching either, the user can still preview `pending_review` via the StateBar.

If you find yourself wanting to write an outcome whose `frame` equals the node's `frame`, you're modelling a state change — drop the outcome and just rely on the StateBar.

### Anatomy

```ts
import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'

export const meta: SceneMeta = {
  name: 'AddStudent',
  category: 'Flows',
  tags: ['admin', 'demo'],
}

const scene: SceneDef = {
  initial: 'form',
  nodes: {
    form: {
      frame: 'ExampleForm',
      state: 'idle',
      gate: ({ variants }) =>
        variants.auth === 'professor' || variants.auth === 'admin',
      fallback: 'notFound',
      outcomes: [
        {
          id: 'success',
          frame: 'AddStudentStatus',
          state: 'success',
          description: 'Submission accepted; student created and the success card is shown.',
          default: true,
        },
        {
          id: 'error',
          frame: 'AddStudentStatus',
          state: 'error',
          description: 'Server rejected the submission (e.g. email already registered).',
        },
      ],
    },
    notFound: {
      frame: 'NotFound',
      state: 'default',
    },
  },
}

export default scene
```

### Outcome fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | `string` | yes | Stable identifier; surfaces in the dropdown ("Go to <id>") and in qa case ids. |
| `frame` | `string` | **yes** | Target frame to render after dispatch. **Must differ from the node's `frame`** — outcomes are frame transitions, not state changes. |
| `state` | `StateKey` | yes | Initial state shown on the target `frame`. Subsequent state changes on that frame are the StateBar's job. |
| `description` | `string` | yes | Plain-language explanation; rendered as the dropdown item subtitle and consumed by the scene-coverage skill. |
| `default` | `boolean` | no | Marks the split-button's primary face. Exactly one per node. |
| `set` | `PartialVariants` | no | Variant flips applied on dispatch. |

### Gate + fallback

`gate` is `(ctx: { variants }) => boolean`. It runs every render of the node (initial mount, after an outcome dispatch, or when a variant changes via the bar). When it returns `false`, `SceneCanvas` navigates the scene to `fallback` (a node id) and updates the URL. A gate without a fallback is an error and `scene-coverage` will refuse to emit cases for it.

Use gates for **access control** only — "this screen is unreachable under variant X". Page-local conditional UI belongs in the component itself.

---

## The mocked `@/components/ui/Button`

Atelier ships a Vite alias that swaps `@/components/ui/Button` with a scene-aware drop-in (`.atelier/mocks/components/ui/Button.tsx`). This is exactly the same trick used for actions/hooks — every component that imports the real Button automatically participates in scenes.

**Outside scenes**: re-exports the real Button verbatim. Visually identical.

**Inside scenes (at the entry frame)**: when the button is a submit (`type="submit"`) or has the default/primary variant, it renders a split-button dropdown:

- The primary face is labelled **"Go to <outcome.id>"** for the outcome marked `default: true` (or the first outcome if none marked). The component's original `children` text is replaced — the only thing the primary face says in scene mode is the outcome destination.
- The caret opens a menu listing every outcome as **"Go to <id>"** with its `description` as the subtitle and the target frame@state as a small hint.
- Clicking any menu item dispatches that outcome immediately. Form submission is prevented — the outcome IS the result.
- Outcomes whose `frame` matches the currently rendered frame are filtered out defensively (they'd be no-ops; intra-frame state changes belong on the StateBar).

**Inside scenes, downstream of a dispatch**: once the user has dispatched an outcome and is on the target frame, the SceneCanvas exposes no outcomes to that frame — any `Button` inside the target frame behaves as a real Button. To restart the flow, use the "Restart" control next to the breadcrumb.

Secondary and ghost buttons stay as their real selves even inside scene mode, so cancel/back actions aren't hijacked.

No per-frame wrapping is required. As long as the component imports `@/components/ui/Button`, the mocked Button takes over inside scenes.

### Implication: real components should use the Button primitive

If a component renders a primary action as an inline `<button>` tag, the mocked Button cannot replace it. When wiring up a new component for scenes:

- Use `@/components/ui/Button` for primary actions and form submits.
- Inline `<button>` is fine for icon-only chrome (close, expand, restart) that scenes don't need to intercept.

---

## URL contract

`PreviewShell` round-trips scene state via query params:

| Param | When set | Meaning |
|-------|----------|---------|
| `scene` | scene mode | Scene name (matches `meta.name`). |
| `node` | scene mode | The user's intended entry node. Stays put even when the gate is failing — the URL preserves intent, the canvas renders the fallback inline. |
| `frame` | scene mode, after dispatch or StateBar override | The currently rendered frame. Absent until the user dispatches an outcome or picks a state on the entry frame's StateBar. |
| `state` | scene mode, after dispatch or StateBar override | The currently rendered state. |
| `v` | when any axis is non-default | Comma-separated `axis:value` pairs. Default values are omitted to keep URLs short. |

This makes scene+variant states deep-linkable for qa cases.

---

## Common pitfalls

- **Modelling a state change as an outcome.** If `outcome.frame === node.frame`, you're trying to navigate states with the dropdown — drop the outcome and use the StateBar. SceneCanvas filters such outcomes out defensively, so the dropdown will silently miss them.
- **Forgetting `default: true`** on exactly one outcome. The split-button still works (falls back to the first outcome), but `scene-coverage` will warn.
- **`gate` without `fallback`**. Renders an explicit error panel and emits zero qa cases for the node.
- **Referencing a frame name that doesn't exist** in `node.frame` or `outcome.frame`. `SceneCanvas` shows an error panel; `scene-coverage` refuses the whole scene.
- **Mixing page-local state into variants**. If only one feature reads an axis, move it to a frame state instead.
- **A primary action that uses inline `<button>` instead of `Button`**. The mocked dropdown won't take over. Refactor to the Button primitive.
- **Auto-submit frames colliding with scene mode**. If a frame state programmatically submits a form on mount, dispatching an outcome that lands on that same state will trigger the auto-submit — which is usually desired (it drives the form to its post-submit visual state), but be aware.
- **Declaring every state of the target frame as an outcome.** Don't. Outcomes should describe what's *actually reachable from this node* in the real feature. States that exist on the target frame but aren't reachable from here belong to the StateBar, not the dropdown.

---

## Quick reference

| You want to… | Do this |
|--------------|---------|
| Add a new global axis | Add it to `variantAxes` in `.atelier/variants.ts`. |
| Have a frame react visually to an axis | Add the key to `meta.variants` and destructure `({ variants })` in render. |
| Add a new screen-level flow | Create `.atelier/scenes/<Name>.scene.tsx` exporting `meta` + a `SceneDef` default. |
| Gate a node by role | Add `gate: ({ variants }) => …` and `fallback: '<otherNodeId>'`. |
| Make a submit button show frame transitions | Ensure the component imports `@/components/ui/Button`; declare `outcomes` on the node, each pointing at a *different* frame. |
| Let users preview "other states" of the entry frame | Don't add outcomes for it — declare those states on the frame and let the StateBar at the top of the canvas handle them. |
| Preview a target-frame state that isn't reachable from this node | Declare the state on the frame, leave it out of `outcomes`. Users reach it via the StateBar after they're on the target frame. |
| Generate qa cases for a scene | Load the `scene-coverage` skill and pass it the scene path. |
