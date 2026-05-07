# Atelier

A dev-only component preview tool. Browse registered React components in isolation and cycle through their **Loading**, **Error**, and **Success** states — no backend, no mock server.

Components are written exactly as they would ship: server actions, `use(promise)` + Suspense, real error boundaries. Each state is a render function that intercepts the server action import via `vi.mock`, so the component renders authentically without any artificial props.

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev) — `use(promise)`, Suspense, ErrorBoundary
- [Vitest](https://vitest.dev) browser mode (Playwright/Chromium) — hosts the preview
- TypeScript (strict)
- Tailwind CSS v4

## Getting started

```bash
npm install
npx playwright install chromium   # first time only
npm run preview
```

Vitest opens a Chromium window with the preview shell. The watcher stays alive — edits to components or mocks hot-reload instantly.

> `npm run dev` still works for the Next.js app, but the preview is only available via `npm run preview`.

## Adding a component

**1. Create the component** in `components/`. If it fetches data, call a server action imported from `actions/` and let the component manage its own loading/error states via `use(promise)` + Suspense + ErrorBoundary.

**2. Create a server action** (if needed) in `actions/`. Keep types in a companion `*.types.ts` file — `'use server'` files may only export async functions.

```ts
// actions/user.types.ts
export interface GetUserProfileParams { userId: string }
export interface GetUserProfileResult { id: string; name: string }
export class GetUserProfileError extends Error { /* ... */ }
```

```ts
// actions/user.ts
'use server'
import type { GetUserProfileParams, GetUserProfileResult } from './user.types'
export async function getUser(params: GetUserProfileParams): Promise<GetUserProfileResult> { /* ... */ }
```

**3. Add a mock file** in `registry/mocks/YourComponent.mock.tsx`. Use `vi.mock` to intercept the server action — Vitest hoists it above all imports so the static import already receives the mock.

```tsx
import { vi } from 'vitest'
vi.mock('@/actions/user', () => ({ getUser: vi.fn() }))

import YourComponent from '@/components/YourComponent'
import { getUser } from '@/actions/user'
import type { StateKey, ComponentState } from '../types'

const mockFn = getUser as ReturnType<typeof vi.fn>

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton while data loads',
    render: () => { mockFn.mockReturnValue(new Promise(() => {})); return <YourComponent key="loading" /> },
  },
  error: {
    description: 'Server returned an error',
    render: () => { mockFn.mockReturnValue(Promise.reject(new Error('Failed'))); return <YourComponent key="error" /> },
  },
  success: {
    description: 'Data loaded successfully',
    render: () => { mockFn.mockReturnValue(Promise.resolve({ id: '1', name: 'Ada Lovelace' })); return <YourComponent key="success" /> },
  },
}

export default states
```

**4. Register it** in `registry/index.ts`:

```ts
import yourComponentStates from './mocks/YourComponent.mock'

export const registry: RegistryEntry[] = [
  // ...existing entries
  { name: 'YourComponent', category: 'Your Category', states: yourComponentStates },
]
```

The sidebar and state switcher update automatically.

## Project structure

```
actions/
  user.ts                    # 'use server' — only async function exports
  user.types.ts              # interfaces + error classes for user action

app/
  layout.tsx                 # minimal root layout
  page.tsx                   # Next.js home (preview runs separately via Vitest)
  _preview/
    PreviewShell.tsx         # sidebar + canvas + state switcher ('use client')
    StateBar.tsx             # Loading / Error / Success buttons
    ComponentCanvas.tsx      # calls entry.states[activeState].render()

components/
  ExampleCard.tsx            # use(promise) + Suspense + ErrorBoundary
  ExampleForm.tsx            # 'use client', manages status internally

preview/
  main.test.tsx              # Vitest browser entry — renders PreviewShell in Chromium

registry/
  index.ts                   # registry array
  types.ts                   # StateKey, ComponentState, RegistryEntry
  mocks/
    ExampleCard.mock.tsx     # vi.mock + render functions for ExampleCard
    ExampleForm.mock.tsx     # AutoSubmitForm wrapper for ExampleForm

vitest.config.ts             # Vitest browser mode config (Playwright/Chromium)
```

## Key constraints

- All UI state (`selectedComponent`, `activeState`) lives in `PreviewShell` via `useState` — no external state library.
- The registry is a static import — no runtime file scanning.
- State switching is props-only — no MSW, no service worker.

