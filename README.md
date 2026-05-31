# Atelier

A dev-only component preview workbench designed for AI-driven development. Browse React components in isolation and cycle through their states — no backend, no mock server.

Components are written exactly as they would ship. Each frame file defines the visual states (loading, error, success, variants) as self-contained render functions. Server actions and hooks can be intercepted per-frame without modifying production code.

## Features

- **Isolated component preview** — browse any component without running the full Next.js app
- **State cycling** — switch between states with one click; each state is a self-contained render function
- **Authentic rendering** — components use real imports; server actions and hooks are intercepted at the module level via Vite aliases, not replaced with fake props
- **Auto-registered frames** — drop a `*.frame.tsx` file into `.atelier/mocks/` and it appears in the sidebar automatically; no manual registration
- **Hot reload** — edits to components or frame files reflect instantly
- **Canvas mode** — view all components at once with category and tag filtering
- **Scenes** — define multi-screen user flows in `.atelier/scenes/*.scene.tsx`; each scene wires frames together via outcomes (frame transitions) and optional gates (access control); the mocked `Button` becomes a split dropdown in scene mode automatically
- **Bug tracking** — fixes are documented automatically in `qa/pending/` by the agent and verified by the dedicated QA agent

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev) — Suspense, ErrorBoundary
- [Vite](https://vite.dev) — hosts the component preview
- TypeScript (strict)
- Tailwind CSS v4

## Getting started

```bash
npm install
npm run preview   # starts Vite, opens the Atelier preview in browser
npm run dev       # starts Next.js app (independent of preview)
```

## Adding a component

**1. Create the component** in `components/`. If it fetches data, call a server action from `actions/` and manage loading/error states via Suspense + ErrorBoundary.

**2. Create a server action** (if needed) in `actions/`. Keep types in a companion `*.types.ts` file — `'use server'` files may only export async functions.

**3. Add a frame file** in `.atelier/mocks/YourComponent.frame.tsx`:

```tsx
// .atelier/mocks/YourComponent.frame.tsx
import YourComponent from '@/components/YourComponent'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'YourComponent',
  category: 'Your Category',
  tags: ['your-tag'],
}

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton while data loads',
    render: () => <YourComponent key="loading" />,
  },
  error: {
    description: 'Error state',
    render: () => <YourComponent key="error" />,
  },
  success: {
    description: 'Data loaded successfully',
    render: () => <YourComponent key="success" />,
  },
}

export default states
```

The sidebar updates automatically — no registration step needed.

**4. Intercept server actions or hooks** (if the component uses them) by adding files to `.atelier/mocks/actions/` or `.atelier/mocks/hooks/`. The Vite config auto-aliases these — no config change needed. See the atelier skill reference for full patterns.

## Adding a scene

Scenes live in `.atelier/scenes/*.scene.tsx` and are auto-discovered. A scene declares an `initial` node and a map of `nodes`, each pointing at an existing `(frame, state)`.

```tsx
// .atelier/scenes/MyFlow.scene.tsx
import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'

export const meta: SceneMeta = { name: 'MyFlow', category: 'Flows' }

const scene: SceneDef = {
  initial: 'start',
  nodes: {
    start: {
      frame: 'MyForm',
      state: 'idle',
      gate: ({ variants }) => variants.auth === 'admin',
      fallback: 'notFound',
      gateTrigger: 'Navigate as a non-admin role (e.g. auth=guest)',
      outcomes: [
        {
          id: 'success',
          frame: 'MyConfirmation',
          state: 'success',
          trigger: 'Click the Submit button',
          description: 'Form accepted; confirmation screen is shown.',
          default: true,
        },
      ],
    },
    notFound: { frame: 'NotFound', state: 'default' },
  },
}

export default scene
```

Key rules:
- `outcome.frame` must differ from the node's own `frame` — outcomes are frame transitions, not state changes. Use the StateBar for intra-frame states.
- `trigger` is required on every outcome — describes the user action that fires it; used by agents to generate QA test steps.
- `gateTrigger` is required by convention when `gate` is set — describes the variant condition that fails the gate; agents use it as the setup step for redirect cases.
- Primary actions must use `@/components/ui/Button` (not `<button>`) to participate in the outcome dropdown automatically.

## Project structure

```
actions/
  user.ts                      # 'use server' — only async function exports
  user.types.ts                # interfaces + error classes

app/
  layout.tsx                   # root layout
  page.tsx                     # Next.js home

components/
  ui/                          # atomic UI primitives (Button, Badge, Label, …)
  ExampleCard.tsx
  ExampleForm.tsx

hooks/
  useMyHook.ts                 # real hook implementation
  useMyHook.types.ts           # types only

.atelier/
  mocks/
    YourComponent.frame.tsx    # frame file — meta + states; auto-discovered
    actions/
      product.ts               # server action interceptor (auto-aliased)
    hooks/
      useArenaSearch.ts        # hook interceptor (auto-aliased)
  registry/
    index.ts                   # assembles registry via import.meta.glob
    types.ts                   # StateKey, ComponentState, MockMeta, RegistryEntry, Outcome, SceneNode
  scenes/
    AddStudent.scene.tsx       # example scene — meta + SceneDef (nodes, outcomes, gate/fallback)
  PreviewShell.tsx             # sidebar + canvas + state switcher
  StateBar.tsx                 # state tab bar
  ComponentCanvas.tsx          # renders active state
  CanvasGrid.tsx               # grid view of all components
  main.tsx                     # Vite entry point
  index.html                   # Vite HTML entry
  tsconfig.json                # Vite/preview tsconfig (includes mock alias paths)

vite.atelier.config.ts         # Vite config — alias interception + dev server

qa/
  pending/                     # agent writes bug case files here after every fix
  verified/                    # promoted once fix is confirmed
  archived/                    # closed cases
```

## Key constraints

- All UI state (`activeIndex`, `activeState`, `mode`) lives in `PreviewShell` via `useState` — no external state library.
- The registry is assembled at Vite startup via `import.meta.glob` — adding a frame file is all that's required.
- `.atelier/` is excluded from the Next.js TypeScript compilation — zero Atelier code leaks into the production bundle.

