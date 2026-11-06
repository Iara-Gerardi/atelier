# Feature contract

Create `features/<slug>/index.md`. Use only the fields below; the scanner validates them against `ai/tools/project-graph/catalog.ts`.

```markdown
---
slug: student-enrollment
name: Student enrollment
goal: Enroll a student by email and confirm the result.
entries:
  - file: app/students/new/page.tsx
    symbol: NewStudentPage
scenes:
  - .atelier/scenes/StudentEnrollment.scene.tsx
---

Includes enrollment and result confirmation. Student editing belongs to a separate capability.
```

The paths and symbols above illustrate the shape. Replace them with verified entries from the project; omit `scenes` if no scene exists.

| Field | Rule |
|-------|------|
| `slug` | Stable kebab-case ID matching the feature directory. |
| `name` | Human-readable capability name. |
| `goal` | One sentence describing what the user or developer achieves. |
| `entries` | Nonempty list of `{ file, symbol? }`; files are repository-relative, symbols name an actual declaration or export. Omit the symbol for a whole-file entry. |
| `exclude` | Optional list of `{ file, symbol? }` traversal boundaries. Use only when necessary to distinguish adjacent capabilities. |
| `scenes` | Optional list of existing `.scene.tsx` paths specifying the feature's screen flow. |

For a preview-only flow, a scene file can be the entry. For multiple capabilities on one page, anchor each to its own component symbol instead of assigning the entire page to each. A shared component may be reached from several features.

Keep prose to a short paragraph only when it adds scope information absent from the goal. Dependencies, frame usage, and evidence paths come from the scanner. Do not add status fields, tags, timestamps, manual file lists, or separate `flow.md`, `frames.md`, and `scenes.md` files.
