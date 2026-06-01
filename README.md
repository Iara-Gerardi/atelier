# Atelier

A dev-only component preview workbench designed for AI-driven development. Browse React components in isolation, cycle through their states, and walk multi-screen user flows — all without running the full app or touching a backend.

Components are written exactly as they would ship. Each frame file defines the visual states (loading, error, success, variants) as self-contained render functions. Server actions and hooks are intercepted per-frame via Vite aliases, not replaced with fake props — so what you see in Atelier is what ships.

The workbench is also the spec surface for agents. Frames, scenes, and variants give agents enough structure to generate components, write QA cases, and verify user flows without executing code.

## Features

- **Isolated component preview** — browse any component without running the full Next.js app
- **State cycling** — switch between states with one click; each state is a self-contained render function
- **Authentic rendering** — components use real imports; server actions and hooks are intercepted at the module level via Vite aliases, not replaced with fake props
- **Auto-registered frames** — drop a `*.frame.tsx` file into `.atelier/mocks/` and it appears in the sidebar automatically; no manual registration
- **Hot reload** — edits to components or frame files reflect instantly
- **Canvas mode** — view all components at once with category and tag filtering
- **Scenes** — define multi-screen user flows in `.atelier/scenes/*.scene.tsx`; each scene wires frames together via outcomes (frame transitions) and optional gates (access control); the mocked `Button` becomes a split dropdown in scene mode automatically
- **AI frame generation** — generate frame files from a component name with `npm run gen-frame`
- **MCP server** — exposes the registry to agents via the Atelier MCP so they can read frames and navigate scenes programmatically
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

The preview (`npm run preview`) and the app (`npm run dev`) are fully independent. You don't need to run `npm run dev` to use the workbench.

## Environment setup

### AI frame generation

`npm run gen-frame` and the Atelier MCP call an LLM to generate frame files. Set one of these in your `.env.local`:

```bash
# Option A — direct OpenAI
OPENAI_API_KEY=sk-...

# Option B — AI Gateway (takes precedence over OPENAI_API_KEY)
AI_GATEWAY_API_KEY=...
```

If neither key is present, `gen-frame` throws with a clear error. The preview (`npm run preview`) and `npm run dev` do **not** require these keys.

### MCP server (for agents in VS Code / Cursor)

The MCP server is already configured in `.vscode/mcp.json` and `.cursor/mcp.json`. It requires the preview to be running:

```bash
npm run preview   # must be running on port 5173
```

Then start the MCP server from your editor's MCP panel — it connects to `http://localhost:5173` automatically. No additional environment variables are needed.

## Adding a component

**1. Create the component** in `components/`. If it fetches data, call a server action from `actions/` and manage loading/error states via Suspense + ErrorBoundary.

**2. Create a server action** (if needed) in `actions/`. Keep types in a companion `*.types.ts` file — `'use server'` files may only export async functions.

**3. Add a frame file.** The fastest way is to let the AI generate it:

```bash
npm run gen-frame --src YourComponent --category "Your Category" --tags ui,forms --states idle,loading,error,success
```

This reads `components/YourComponent.tsx`, infers the frame structure, and writes `.atelier/mocks/YourComponent.frame.tsx`. Review and adjust the output before committing.

To write a frame manually, create `.atelier/mocks/YourComponent.frame.tsx`:

```tsx
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
