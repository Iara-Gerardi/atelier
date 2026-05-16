# Features

This folder contains architectural documentation for each feature in the app. It is maintained by the agent — do not edit manually unless you are correcting factual errors.

---

## Folder structure

```
features/
  <feature-slug>/
    index.md    — summary, status, file references
    flow.md     — mermaid user-flow diagram + numbered interaction legend
    frames.md   — list of Atelier frame files that cover this feature
```

One folder per feature. The slug is kebab-case and matches the feature's primary component name when possible (e.g. `example-search-tab`, `home-page`).

---

## File roles

### `index.md`

The entry point for the feature. Contains:

- **Front-matter**: name, slug, status, created date, tags
- **Summary**: one-paragraph description of what the feature does and why it exists
- **File references**: links to the components, actions, hooks, and any other source files that belong to this feature
- **Links** to `flow.md` and `frames.md`

### `flow.md`

A Mermaid `sequenceDiagram` that maps the user journey and system interactions.

**Pillars** (participants) are always:

| Participant | Meaning |
|-------------|---------|
| `User` | The person using the UI |
| `Frontend` | React components, hooks, client-side logic |
| `Backend` | Server actions, API routes, data layer |

Third-party providers (e.g. external APIs, auth services, search engines) are **not** modelled as participants in the diagram. Instead they are described in a "Third-party notes" section below the diagram.

Each arrow in the diagram carries a number (`1`, `2`, `3`, …). A numbered legend below the diagram explains each step in plain language.

### `frames.md`

A flat list of `.atelier/mocks/*.frame.tsx` paths that provide visual coverage for this feature. One path per line.

---

## When documentation is created or updated

The agent creates or updates feature documentation when:

- A **new feature** is built (new component folder under `components/`)
- **Functional requirements change** — user flow is altered, new interactions are added, or existing ones are removed

The agent does **not** touch feature documentation for:

- Bugfixes that do not change observable behavior or user flow
- Style / layout / refactor changes with no functional impact
- Adding or adjusting Atelier frame states for behavior that already existed
