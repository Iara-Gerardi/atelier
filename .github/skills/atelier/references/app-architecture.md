# App Architecture Reference

## Folder structure overview

```
components/
  ui/                          ← Atomic/shared UI primitives (flat, one file each)
    Button.tsx
    Badge.tsx
    Label.tsx
    Pagination.tsx
  forms/                       ← Domain group; one extra level of nesting acceptable
    LoginForm/
      index.tsx
      components/
        FieldRow.tsx
  FeatureName/                 ← Feature component (complex enough for sub-components)
    index.tsx
    components/
      SubComponentA.tsx
      SubComponentB.tsx

actions/
  myAction.ts                  ← Server action implementation
  myAction.types.ts            ← Types only (imported by both action and mock interceptor)

hooks/
  useMyHook.ts                 ← Real implementation, re-exports from .types.ts
  useMyHook.types.ts           ← Types only

preview/
  mocks/
    MyComponent.mock.tsx       ← Flat; one file per component
    actions/
      myAction.ts              ← Mock interceptor (auto-aliased by Vite)
    hooks/
      useMyHook.ts             ← Mock interceptor (auto-aliased by Vite)
```

---

## Nesting rules

| Situation | Rule |
|-----------|------|
| Simple component, single concern | Single file: `components/MyComponent.tsx` |
| Component with 2+ sub-components | Folder: `components/MyComponent/index.tsx` + `components/MyComponent/components/` |
| Sub-component that itself needs children | Promote to its own top-level folder: `components/SubName/` |
| Shared atomic UI (button, badge, input, pagination) | Always in `components/ui/` — flat, never nested |
| Domain group of related feature components | `components/<domain>/` with one extra level allowed (e.g. `components/forms/LoginForm/`) |

**Max nesting depth**: `components/` → `FeatureName/` → `components/` (2 levels). If a sub-component grows complex enough to need its own sub-components, promote it to a top-level `components/Name/` folder.

---

## Naming conventions

- Component files: `PascalCase.tsx`
- Hook files: `useCamelCase.ts` / `useCamelCase.types.ts`
- Action files: `camelCase.ts` / `camelCase.types.ts`
- Mock files: `<ComponentName>.mock.tsx` (flat in `preview/mocks/`)
- Index files: always `index.tsx` for folder-based components

---

## Component anatomy (folder-based)

```
components/MyComponent/
  index.tsx              ← Default export, public API.
                           `import ... from '@/components/MyComponent'` resolves here.
  components/
    SubComponentA.tsx    ← Internal; not imported from outside this folder.
    SubComponentB.tsx
```

Imports of `@/components/MyComponent` resolve to `index.tsx` automatically — no other files need to change when a simple component is promoted to a folder.

---

## ui/ primitives

Components in `components/ui/` are the atomic layer — no domain logic, no data fetching:

- Accept only props (no hooks, no actions)
- Export named functions (not default exports)
- Are freely imported by any component in the tree
- Each has its own mock file covering all visual variants (category: `"UI"`)

---

## Tags taxonomy

Tags filter the canvas view in Atelier. Use domain-specific tags consistently:

| Domain | Suggested tags |
|--------|----------------|
| Commerce | `checkout`, `products`, `cart` |
| Are.na integration | `arena`, `discovery`, `search` |
| Pages | `home`, `profile`, `settings` |
| UI primitives | `ui`, `interactive`, `forms` |
| User | `user`, `auth`, `profile` |

Tags are optional but strongly encouraged for feature-area components.
