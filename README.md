# Atelier

A dev-only component preview tool. Browse registered React components in isolation and switch between their **Loading**, **Error**, and **Success** states — no backend, no mocks server, just props.

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- TypeScript (strict)
- Tailwind CSS

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a component

**1. Create the component** in `components/`.

**2. Add a mock file** in `registry/mocks/YourComponent.mock.ts` that exports a typed `Record<StateKey, ComponentState>`:

```ts
import type { StateKey, ComponentState } from '../types'

const states: Record<StateKey, ComponentState> = {
  loading: { props: { isLoading: true } },
  error:   { props: { isLoading: false, error: 'Something went wrong.' } },
  success: { props: { isLoading: false, data: { /* ... */ } } },
}

export default states
```

**3. Register it** in `registry/index.ts`:

```ts
import YourComponent from '@/components/YourComponent'
import yourComponentStates from './mocks/YourComponent.mock'

export const registry: RegistryEntry[] = [
  // ...existing entries
  {
    name: 'YourComponent',
    category: 'Your Category',
    component: YourComponent,
    states: yourComponentStates,
  },
]
```

The sidebar and state switcher update automatically — no other changes needed.

## Project structure

```
app/
  page.tsx                   # server component — imports registry, renders shell
  layout.tsx                 # minimal root layout
  _preview/
    PreviewShell.tsx         # sidebar + canvas + state switcher (all state lives here)
    StateBar.tsx             # Loading / Error / Success buttons
    ComponentCanvas.tsx      # renders the active component with active state props

registry/
  index.ts                   # registry array
  types.ts                   # StateKey, ComponentState, RegistryEntry
  mocks/
    ExampleCard.mock.ts
    ExampleForm.mock.ts

components/
  ExampleCard.tsx
  ExampleForm.tsx
```

## Key constraints

- All UI state (`selectedComponent`, `activeState`) lives in `PreviewShell` via `useState` — no external state library.
- The registry is a static import — no runtime file scanning.
- State switching is props-only — no MSW, no service worker.

