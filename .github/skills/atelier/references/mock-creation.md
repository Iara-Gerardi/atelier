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

export default states
```

**Always pass a `key` prop** matching the state name on the root component element. This forces React to remount the component when the state changes, preventing stale state from bleeding between previews.

---

## What qualifies as a distinct state?

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
    render: () => { setUseSession(() => ({ user: null })); return <NavBar key="guest" /> },
  },
  logged_in: {
    description: 'Authenticated user — shows avatar and nav links',
    render: () => { setUseSession(() => ({ user: { name: 'Ada', role: 'user' } })); return <NavBar key="logged_in" /> },
  },
  admin: {
    description: 'Admin user — shows extra controls',
    render: () => { setUseSession(() => ({ user: { name: 'Ada', role: 'admin' } })); return <NavBar key="admin" /> },
  },
}
```

---

## Intercepting server actions

If a component imports a server action (e.g. `import { getProducts } from '@/actions/product'`), create a mock interceptor. Action types live in a separate `actions/myAction.types.ts` — import from there, **not** from the action file itself (which would be circular):

```ts
// .atelier/mocks/actions/myAction.ts
import type { MyResult } from '@/actions/myAction.types'

type Fn = () => Promise<MyResult>
let _impl: Fn = () => { throw new Error('Not configured') }
export function setMyAction(impl: Fn): void { _impl = impl }
export async function myAction(): Promise<MyResult> { return _impl() }
```

Drop the file in `.atelier/mocks/actions/` — the Vite config auto-scans that folder and creates the alias automatically. **No Vite config change needed.**

Use the setter inside each state's `render` function:

```tsx
render: () => {
  setMyAction(() => Promise.resolve(myData))
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

type UseMyHookFn = () => UseMyHookResult
let _impl: UseMyHookFn = () => ({ /* sensible defaults */ })
export function setUseMyHook(impl: UseMyHookFn): void { _impl = impl }
export function useMyHook(_arg: unknown): UseMyHookResult { return _impl() }
```

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
