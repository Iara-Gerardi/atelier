# Feature Documentation Templates

Use these templates verbatim when creating or updating files in `features/<slug>/`. Fill in every placeholder — do not leave template text in the output.

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

## Source files

### Components
- `components/<FeatureName>/index.tsx`
- `components/<FeatureName>/components/<SubComponent>.tsx`

### Actions
- `actions/<domain>.ts`

### Hooks
- `hooks/<useHookName>.ts`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
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
