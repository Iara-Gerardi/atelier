# Frame File Creation Reference

## Frame file anatomy

Every component in `components/` must have exactly one frame file at `.atelier/mocks/<ComponentName>.frame.tsx`.

```tsx
// .atelier/mocks/MyComponent.frame.tsx
import MyComponent from '@/components/MyComponent'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'MyComponent',
  category: 'Your Category',
  tags: ['tag1', 'tag2'],
}

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton while data is fetching',
    render: () => <MyComponent key="loading" />,
  },
  error: {
    description: 'Error state',
    render: () => <MyComponent key="error" />,
  },
  success: {
    description: 'Fully loaded',
    render: () => <MyComponent key="success" />,
  },
}
```

> **Note:** The descriptions above are intentionally terse to keep the anatomy legible. See [Writing state descriptions](#writing-state-descriptions) below for the quality bar required in real frame files.

export default states
```

**Always pass a `key` prop** matching the state name on the root component element. This forces React to remount the component when the state changes, preventing stale state from bleeding between previews.

**A frame file must contain exactly two things: the `meta` named export and the `states` default export.** No helper functions, no constants, no additional exports. Fixture data, shared mock values, and setup utilities belong in a sibling file (e.g. `MyComponent.frame.fixtures.ts`) or inside the action/hook mock file — never in the frame file itself.

**Render functions must be logic-less.** The only code permitted inside `render` is the setter call(s) needed to configure mocks and the JSX return. No conditionals, no computed variables, no helper calls. If a logic variation changes what the user sees, it is a separate state — not a branch inside an existing one.

---

## Writing state descriptions

The `description` field is the **source of truth** for any automated agent (MCP, QA, CI) inspecting the registry. It must be self-contained: an agent reading only the registry JSON must be able to understand what the state renders, what data drives it, and what mocks are active — **without reading any source code**.

### Required content

Every description must answer:

1. **What does the user see?** Describe the visual output, not just the state name.
2. **What mock values are active?** Name the hook or action mock and the key values it returns.
3. **What fixture data shapes the render?** If mock data is inline, summarize it (e.g. "4 blocks, 2 channels").
4. **Any interaction precondition?** If the state is only reached after a user action, say so.

### Rules

- Avoid synonyms of the key. `error: { description: 'Error state' }` adds zero information.
- Be concrete about mock return values, not vague (`'returns error'` → `'returns { error: "Rate limited", isLoading: false }'`).
- Quantify fixture data when it affects layout (`'1 item'` vs `'many items'` vs `'empty array'`).
- One or two sentences is the target length — detailed but not verbose.

### Before / after

| ❌ Too terse | ✅ Self-contained |
|---|---|
| `'Error state'` | `'Search failed: useArenaSearch returns { error: "Rate limited", isLoading: false }. Shows inline error banner with retry CTA.'` |
| `'No query — prompt to start searching'` | `'Idle: no query entered. useArenaSearch returns empty arrays, isLoading: false. Shows centered placeholder prompt.'` |
| `'Fully loaded'` | `'Success: 4 blocks and 2 channels returned (MOCK_BLOCKS + MOCK_CHANNELS), hasMore: true. Pagination footer is visible.'` |
| `'Skeleton while data is fetching'` | `'Loading: useArenaSearch returns isLoading: true, empty arrays. Renders skeleton rows in place of real content.'` |

---

## What qualifies as a distinct state?

**Rule:** A state is a reproducible, reachable visual or interactive configuration. Inspect render conditions (`if`, ternary, `&&`, attributes) as evidence, not as a one-to-one list of state keys. Several branches can contribute to one state, and independent branches can produce combinations that need separate states. Data can change the render without changing any branch.

Run `npm run atelier:coverage -- --frame <name>` to attribute branch execution to frame/state/variant assignments. Add an explicit coverage plan with visible/text assertions to verify the intended output. An executed branch alone does not prove that the result was visible; an unobserved branch does not prove it is unreachable. See `docs/project-graph.md`.

A state is any meaningfully different visual or interactive configuration of the component. **Enumerate all states upfront** — the goal is that every visual variant a real user could encounter is represented as a named state in the frame file.

| Category | Examples |
|----------|---------|
| **Async phase** | `loading` (skeleton), `error`, `success` |
| **Auth / role** | `guest`, `logged_in`, `admin`, `banned` |
| **Data shape** | `empty` (no results), `single_item`, `many_items`, `paginated` |
| **User interaction** | `idle`, `focused`, `expanded`, `collapsed`, `submitting` |
| **Permission / limit** | `rate_limited`, `unauthorized`, `read_only` |
| **Feature flag** | `with_feature_x`, `without_feature_x` |
| **Presentation variant** | `primary`, `secondary`, `ghost`, `disabled` (for UI primitives) |

Rules of thumb:
- If a state triggers a visually distinct render, it deserves its own state key.
- If the only difference is a prop value that doesn't change the layout, a single state with a note is fine.
- Don't mock unreachable states that the component's own logic prevents.
- **When in doubt, add the state.** A frame file with 7 states is better than one that hides half the component's real behavior.

**Auth/role states** deserve special attention. If a component renders differently for a guest versus a logged-in user, those are two states — not two components. Model them explicitly:

```tsx
const states: Record<StateKey, ComponentState> = {
  guest: {
    description: 'Unauthenticated visitor — shows login prompt',
    render: () => { setUseSession('guest'); return <NavBar key="guest" /> },
  },
  logged_in: {
    description: 'Authenticated user — shows avatar and nav links',
    render: () => { setUseSession('logged_in'); return <NavBar key="logged_in" /> },
  },
  admin: {
    description: 'Admin user — shows extra controls',
    render: () => { setUseSession('admin'); return <NavBar key="admin" /> },
  },
}
```

---

## Intercepting server actions

**Scope rule:** only create a mock for an action that is used by a component that has a frame. Do not mock every action in the codebase.

**What counts as a mock state:** every distinct resolved return shape is one state; every distinct thrown error is one state. Name states after the behavior (`success`, `not_found`, `server_error`), not the transport (`200`, `404`, `500`).

If a component imports a server action (e.g. `import { getProducts } from '@/actions/product'`), create a mock interceptor. Action types live in a separate `actions/myAction.types.ts` — import from there, **not** from the action file itself (which would be circular):

```ts
// .atelier/mocks/actions/myAction.ts
import type { MyResult } from '@/actions/myAction.types'

export const meta = {
  states: ['success', 'not_found', 'server_error'] as const,
} as const

export type MockState = typeof meta.states[number]

const fixtures: Record<MockState, () => Promise<MyResult>> = {
  success: () => Promise.resolve({ /* fixture data */ }),
  not_found: () => Promise.reject(new Error('Not found')),
  server_error: () => Promise.reject(new Error('Server error')),
}

let _state: MockState = 'success'
export function setMyAction(state: MockState): void { _state = state }
export async function myAction(): Promise<MyResult> { return fixtures[_state]() }
```

Rules:
- **`meta.states`** is the single source of truth for state names. `MockState` is derived from it — never write the union type by hand.
- **Fixture data lives in the mock file** — not in the frame. Frames call `setMyAction('success')`; they do not pass fixture objects.
- **The first entry in `meta.states` is the default state.** `_state` is initialized to it so standalone previews work before any setter call.
- **The exported function name must match the real action** so the Vite alias is transparent.
- **Input arguments are not part of the mock contract.** Action params are ignored; the active state determines the output. Do not model input variations as states.

Drop the file in `.atelier/mocks/actions/` — the Vite config auto-scans that folder and creates the alias automatically. **No Vite config change needed.**

Use the setter inside each frame state's `render` function:

```tsx
render: () => {
  setMyAction('success')
  return <MyComponent key="success" />
},
```

---

## When do you need to mock a hook?

Hook mocking works via Vite module aliases — the same mechanism as action mocking. It is **not always needed**. Use this decision tree:

| Hook characteristic | Action |
|---------------------|--------|
| Pure client-side library (XState, `useState` wrapper, `useLocalStorage`) | **No mock needed** — runs as-is in Vite |
| Custom hook that only reads client state or browser APIs | **No mock needed** |
| Custom hook that calls a server action internally | **Mock required** — Vite cannot execute server actions |
| Custom hook that calls an external API (`fetch`, GraphQL) | **Mock recommended** — avoid real network calls in preview |
| Custom hook you want to pin to a specific value per state | **Mock useful** — lets you control exactly what the component sees |

If a hook falls into "no mock needed", import it normally in the frame file. The real implementation runs in the Vite preview exactly as it would in the browser.

If you do need a mock, follow the interceptor pattern below.

---

## Intercepting hooks

Three files are involved when a component uses a custom hook:

**1. `hooks/useMyHook.types.ts`** — types only (source of truth):

```ts
export interface UseMyHookResult { ... }
```

**2. `hooks/useMyHook.ts`** — real implementation, re-exports types:

```ts
export type { UseMyHookResult } from './useMyHook.types'
import type { UseMyHookResult } from './useMyHook.types'

export function useMyHook(): UseMyHookResult { /* real impl */ }
```

**3. `.atelier/mocks/hooks/useMyHook.ts`** — mock interceptor, imports from `.types.ts` only:

```ts
import type { UseMyHookResult } from '../../../hooks/useMyHook.types'

export type { UseMyHookResult }

export const meta = {
  states: ['idle', 'loading', 'success', 'error'] as const,
} as const

export type MockState = typeof meta.states[number]

const fixtures: Record<MockState, UseMyHookResult> = {
  idle:    { /* sensible idle defaults */ },
  loading: { isLoading: true, /* ... */ },
  success: { /* populated result */ },
  error:   { error: 'Something went wrong', /* ... */ },
}

let _state: MockState = 'idle'
export function setUseMyHook(state: MockState): void { _state = state }
export function useMyHook(_arg: unknown): UseMyHookResult { return fixtures[_state] }
```

Same rules apply as for action mocks: `meta.states` is the source of truth, fixture data lives in this file, hook input arguments are ignored — the active state determines the return value.

Drop in `.atelier/mocks/hooks/` — auto-aliased by Vite. **No Vite config change needed.**

Add a path to `.atelier/tsconfig.json` for IDE type-checking:

```json
"@/hooks/useMyHook": ["./.atelier/mocks/hooks/useMyHook.ts"]
```

> **Why a separate types file?** The mock interceptor IS the aliased module. If it imported from the real hook file, Vite would redirect that import back to the mock itself — a circular dependency. Importing from a `.types.ts` file (which is never aliased) avoids this.

---

## Avoiding the loading flash for pre-resolved states

When a mock state should skip the skeleton entirely (e.g. `success`, `error`), annotate the promise before returning so React 19's `use()` reads it synchronously:

```ts
function fulfilled<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as any
  p.status = 'fulfilled'; p.value = value
  return p
}

function rejected<T>(reason: unknown): Promise<T> {
  const p = Promise.reject(reason) as any
  p.catch(() => {}); p.status = 'rejected'; p.reason = reason
  return p
}
```

Use `fulfilled(data)` instead of `Promise.resolve(data)` in `success`/`error` states when the component uses `use()` internally.
