# Atelier — Agent Instructions

## Registry System

Atelier is a component preview workbench. Every component that lives in `components/` **must** have a corresponding registry entry. Creating the registry entry is not optional — it is a required part of shipping any new component.

---

## What the registry is

The registry connects components to the preview shell. It consists of two parts:

| File | Purpose |
|---|---|
| `registry/index.ts` | Lightweight manifest (name + category). Used outside the preview environment. |
| `preview/registry.ts` | Full entry with rendered states and tags. Used by the preview shell. |

The type contract lives in `registry/types.ts`:

```ts
export type StateKey = string

export interface ComponentState {
  render: () => ReactNode
  description?: string
}

export interface RegistryEntry {
  name: string
  category: string
  tags?: string[]
  states: Record<StateKey, ComponentState>
}
```

---

## How to add a registry entry for a new component

### 1. Create the mock states file

Every component needs a mock file at `preview/mocks/<ComponentName>.mock.tsx`.

The mock file must export a `Record<StateKey, ComponentState>` as its default export. State keys are free-form strings — use whatever names match the component's actual states (e.g. `loading`, `error`, `success`, `idle`, `empty`, `rate_limited`).

```tsx
// preview/mocks/MyComponent.mock.tsx
import MyComponent from '@/components/MyComponent'
import type { StateKey, ComponentState } from '@/registry/types'

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

Always pass a `key` prop matching the state name on the root component element. This forces React to remount the component when the state changes.

### 2. Register in `preview/registry.ts`

```ts
import myComponentStates from './mocks/MyComponent.mock'

export const registry: RegistryEntry[] = [
  // ...existing entries
  { name: 'MyComponent', category: 'Your Category', tags: ['tag1', 'tag2'], states: myComponentStates },
]
```

### 3. Register in `registry/index.ts`

```ts
export const registry = [
  // ...existing entries
  { name: 'MyComponent', category: 'Your Category' },
] as const

```

---

## Intercepting dependencies for mocks

Components should never be modified for preview purposes. Instead, dependencies are intercepted at the module level using mock interceptors that Vite aliases over the real implementation.

### Server actions

If a component imports a server action (e.g. `import { getProducts } from '@/actions/product'`), create a mock interceptor. Action types already live in a separate `actions/myAction.types.ts` file — import from there, not from the action file itself (which would be circular):

```ts
// preview/mocks/actions/myAction.ts
import type { MyResult } from '@/actions/myAction.types'

type Fn = () => Promise<MyResult>
let _impl: Fn = () => { throw new Error('Not configured') }
export function setMyAction(impl: Fn): void { _impl = impl }
export async function myAction(): Promise<MyResult> { return _impl() }
```

Drop the file in `preview/mocks/actions/` — the Vite config auto-scans that folder and creates the alias automatically. No Vite config change needed.

### Hooks

If a component imports a hook, three files are involved:

**1. Hook types file** — `hooks/useMyHook.types.ts` (source of truth for types):

```ts
// hooks/useMyHook.types.ts
export interface UseMyHookResult { ... }
```

**2. Real hook** — imports and re-exports from the types file:

```ts
// hooks/useMyHook.ts
export type { UseMyHookResult } from './useMyHook.types'
import type { UseMyHookResult } from './useMyHook.types'

export function useMyHook(): UseMyHookResult { /* real impl */ }
```

**3. Mock interceptor** — also imports from the types file (not from the hook itself — that would be circular):

```ts
// preview/mocks/hooks/useMyHook.ts
import type { UseMyHookResult } from '../../../hooks/useMyHook.types'

export type { UseMyHookResult }

type UseMyHookFn = () => UseMyHookResult
let _impl: UseMyHookFn = () => ({ /* sensible defaults */ })
export function setUseMyHook(impl: UseMyHookFn): void { _impl = impl }
export function useMyHook(_arg: unknown): UseMyHookResult { return _impl() }
```

Drop the file in `preview/mocks/hooks/` — the Vite config auto-scans that folder and creates the alias automatically. No Vite config change needed.

Add a `tsconfig.json` path for the `@/` import form (for IDE type-checking):

```json
// preview/tsconfig.json
"@/hooks/useMyHook": ["./preview/mocks/hooks/useMyHook.ts"]
```

> **Why a separate types file?** The mock interceptor IS the aliased module. If it imported from the real hook file, Vite's alias would redirect that import back to the mock itself — a circular dependency. Importing from a `.types.ts` file (which is never aliased) avoids this.

### Avoiding the loading flash for pre-resolved states

When a mock state should render without showing a loading/skeleton state (e.g. `success` and `error`), annotate the promise before returning it so React 19's `use()` reads it synchronously:

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

---

## Component folder structure

Simple components may be a single file (`components/MyComponent.tsx`).

Complex components with multiple sub-components should use a folder:

```
components/
  MyComponent/
    index.tsx              ← default export, public API unchanged
    components/
      SubComponentA.tsx
      SubComponentB.tsx
```

Imports of `@/components/MyComponent` resolve to `index.tsx` automatically — no other files need to change when a component is promoted to a folder.

---

## Tags

Tags are used to filter the canvas view. Assign meaningful tags that reflect the feature area or domain of the component (e.g. `checkout`, `user`, `arena`, `discovery`). Tags are optional but strongly encouraged for components that belong to a feature area.

---

## Checklist for any new component

- [ ] Component created in `components/`
- [ ] Mock states file created at `preview/mocks/<ComponentName>.mock.tsx`
- [ ] Entry added to `preview/registry.ts` (with `tags`)
- [ ] Entry added to `registry/index.ts`
- [ ] If component uses a server action: mock interceptor + Vite alias + tsconfig path added
- [ ] If component uses a hook: mock interceptor + Vite alias + tsconfig path added
