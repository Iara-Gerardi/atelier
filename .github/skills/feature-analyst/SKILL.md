---
name: feature-analyst
description: Maintain Atelier's compact feature catalog when adding a capability or changing its goal, entry points, or user flow. Excludes styling, behavior-preserving fixes, and adding previews for existing behavior.
---

# Feature Analyst

Record the intent that source analysis cannot supply. Each feature has one contract at `features/<slug>/index.md`; the directed project graph derives the frames and dependencies used by it.

## Contract

Read [the template](references/templates.md) before writing. The required YAML fields are `slug`, `name`, `goal`, and `entries`. Optional fields are `exclude` and `scenes`. The slug is a stable identifier matching the directory, not a name to regenerate when files move. A brief scope paragraph is optional.

An entry is `{ file, symbol? }`. Use repository-relative paths and actual source symbol names or exports. Omit `symbol` only when the whole file is the intended entry. A feature may start at a route, a component within a larger page, or an Atelier scene for a preview-only flow. A new component folder alone does not establish a new feature.

Features label where frames are used; they do not assign exclusive ownership of shared components. One frame can serve several features. Imports and calls establish dependencies, not user navigation or scene outcomes.

## Workflow

1. Read the existing catalog and the changed entry points. Reuse the feature whose goal covers the change. Add a feature only for a distinct capability, choosing the narrowest evidenced entries.
2. Create or update its contract in the same work session. Keep the goal to one sentence. Use `exclude` only for an evidenced boundary that traversal would otherwise cross. List actual scene files in `scenes` when they specify this feature's flow.
3. Run `npm run atelier:scan` after functional changes. Review unresolved entries, broken references, affected frames, and stale coverage. Adjust the contract or source evidence where needed; do not force an unclassified entry into an unrelated feature.
4. For new or behaviorally changed scenes, invoke `.github/skills/scene-coverage/SKILL.md`. Also invoke it when newly associating a scene with a feature whose coverage needs establishing. A documentation-only migration of an unchanged scene association does not require regeneration. Never write scene-derived QA cases from this skill.
5. Report the contract changed and any unresolved graph or coverage findings. Generated graph updates are not proof that a frame's states or scene behavior have been verified.

## Initial discovery and ongoing work

`npm run atelier:catalog -- --preview` proposes the initial catalog using the configured generative provider and Jev review; `--write` persists it. Use discovery for an uninitialized app, not after every change. Keep the provider/model configurable through Atelier's AI setup.

After bootstrap, maintain contracts incrementally with this skill. `npm run atelier:watch` can refresh local graph reports as files change; `npm run atelier:scan -- --check` checks drift and errors without advancing the stored baseline. These commands surface missing documentation even if an agent forgets this workflow.

Do not maintain manual source inventories, frame lists, or duplicate flow diagrams. Scenes remain the authored screen-flow specification. Preserve a contract's intent during refactors, updating entry references when needed without inventing a new capability.
