# Feature Documentation Templates

Use these templates verbatim when creating or updating files in `features/<slug>/`. Fill in every placeholder — do not leave template text in the output.

## Size budgets (hard limits)

Docs must stay short so devs read them and agents spend few tokens. Do not exceed:

| File | Budget |
|------|--------|
| `index.md` | ≤ 40 lines |
| `flow.md` | ≤ 30 lines (one diagram + numbered legend) |
| `frames.md` | ≤ 15 lines (path list only) |
| `scenes.md` | ≤ 15 lines (path list only) |

Prefer tables and bullets over prose; never restate code. If a file wants to grow past budget, split the feature rather than bloat the file. Drop optional sections (e.g. "Third-party notes", empty subsections) instead of padding them.

---

## `index.md`

```markdown
---
name: <Human-readable feature name>
slug: <kebab-case-slug>
status: <draft|active|deprecated>
created: <YYYY-MM-DD>
tags: [<tag1>, <tag2>]
---

## Summary

<One paragraph. What the feature does, who uses it, and why it exists. Write for a developer reading it cold.>

## Feature definition

- **Goal**: <What user problem this capability solves>
- **Primary actor**: <Who mainly uses it>
- **Entry points**: <Route/page/layout + feature root component>
- **In scope**: <Behaviors this feature owns>
- **Out of scope**: <Adjacent concerns this feature does not own>

## Entry points / pages

- `app/page.tsx`
- `app/<segment>/page.tsx`
- `app/<segment>/layout.tsx`

## Source files

### Components
- `components/<FeatureName>/index.tsx`
- `components/<FeatureName>/components/<SubComponent>.tsx`

### Actions
- `actions/<domain>.ts`

### Hooks
- `hooks/<useHookName>.ts`

### Utilities
- `utils/<helper>.ts`

### Other supporting files
- `actions/<domain>.types.ts`
- `components/<FeatureName>/constants.ts`

## Integrations with other features

- `<other-feature-slug>` — <How this feature integrates: import, shared hook/action, scene handoff, or composition boundary>

## Traceability checklist

- [ ] Summary claim: <key behavior> -> backed by `<path/to/file.ts>`
- [ ] Summary claim: <entry path> -> backed by `<path/to/page-or-layout.tsx>`
- [ ] Summary claim: <cross-feature integration> -> backed by `<path/to/evidence.ts>`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
```

---

## `flow.md`

```markdown
# <Feature Name> — User Flow

## Diagram

\`\`\`mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend

  User->>Frontend: 1. <action>
  Frontend->>Backend: 2. <request>
  Backend-->>Frontend: 3. <response>
  Frontend-->>User: 4. <rendered result>
\`\`\`

## Interaction legend

1. **<Short label>** — <One sentence explaining what happens and why.>
2. **<Short label>** — <One sentence explaining what happens and why.>
3. **<Short label>** — <One sentence explaining what happens and why.>
4. **<Short label>** — <One sentence explaining what happens and why.>

## Third-party notes

> List any external providers involved (e.g. search API, auth service, image CDN). For each, describe what data is sent and what is returned. If there are none, remove this section.

- **<Provider name>**: <What it does in this flow, what data crosses the boundary.>
```

**Rules for the diagram:**
- Participants are always `User`, `Frontend`, `Backend` — no others in the `participant` declarations
- Number every arrow sequentially starting at `1` — embed the number at the start of the message label
- Use `->>` for requests/actions and `-->>` for responses/results
- Keep labels short (≤ 8 words); full explanation goes in the legend
- Add `alt` / `opt` blocks for branching paths (error states, empty results, etc.) — number those arrows in the same sequence

> `flow.md` captures **request/response over time** (User ↔ Frontend ↔ Backend). The screen-by-screen experience and its interactive branches are captured in [`scenes.md`](#scenesmd) and the scene files it points to — the two docs are complementary.

---

## `frames.md`

```markdown
# <Feature Name> — Frame References

Frame files that provide Atelier visual coverage for this feature:

- `.atelier/mocks/<FrameName>.frame.tsx`
```

**Rules:**
- One path per line, as a markdown list item
- Paths are relative to the workspace root
- Only include frames that are **directly** related to this feature's components or flows
- If no frame exists yet, write `<!-- no frames yet -->` as a placeholder

---

## `scenes.md`

```markdown
# <Feature Name> — Scene References

Atelier scene files that exercise this feature's user flow end-to-end:

- `.atelier/scenes/<SceneName>.scene.tsx`
```

**Rules:**
- One path per line, as a markdown list item
- Paths are relative to the workspace root
- Only include scenes whose `nodes[*].frame` references at least one frame in this feature's `frames.md`
- If no scene exists yet, write `<!-- no scenes yet -->` as a placeholder
- A scene may appear in multiple features' `scenes.md` files if it spans them — that's intentional, scenes are the cross-feature glue
- Whenever this file gains or loses an entry, the `scene-coverage` skill (`.github/skills/scene-coverage/SKILL.md`) must be invoked on the affected scenes so `qa/pending/` stays in sync
