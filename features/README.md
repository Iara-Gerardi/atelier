# Features

Each capability has one contract at `features/<slug>/index.md`. The catalog records intent and entry points; Atelier's directed graph derives which frames and dependencies are used by each feature, including the paths that justify those labels. Shared frames may belong to several features.

Required YAML frontmatter:

```yaml
slug: home
name: Home
goal: Browse a paginated product grid from the landing page.
entries:
  - file: app/page.tsx
    symbol: Home
```

The slug is a stable kebab-case ID matching its directory. Each entry has a repository-relative `file` and optional `symbol` naming a declaration or export. Without a symbol, the entry covers the whole file. Use a component entry for a capability inside a larger page, or a scene entry for a preview-only flow.

Optional fields:

- `exclude`: entries shaped like `{ file, symbol? }` that bound graph traversal.
- `scenes`: existing `.atelier/scenes/*.scene.tsx` paths describing this feature's flow.

A short scope paragraph may follow the frontmatter. The schema is defined in `ai/tools/project-graph/catalog.ts`; no additional metadata fields are accepted. Frame lists, dependency inventories, and duplicate flow diagrams are not maintained manually. Scene files remain the canonical screen-flow specification; imports do not imply navigation.

## Maintaining the catalog

Use `.github/skills/feature-analyst/SKILL.md` when adding a capability or changing its goal, entry points, or user flow. Update the contract in the same session. Renames preserve the feature ID and update its references; styling or extra previews for existing behavior do not establish a new feature.

Initial discovery runs through `npm run atelier:catalog -- --preview` and `--write`, using the configured generative provider and Jev review. After bootstrap, agents maintain the existing catalog incrementally rather than rediscovering every feature.

Run `npm run atelier:scan` after functional changes and review the affected artifacts and coverage. `npm run atelier:watch` refreshes local reports as files change. `npm run atelier:scan -- --check` checks drift and errors without updating the baseline. Unclassified entry points remain findings until their intent is documented.

New or behaviorally changed scenes use the `scene-coverage` skill to derive QA cases. A contract's scene association documents the flow; neither that association nor a successful graph scan proves that its behavior has passed QA.
