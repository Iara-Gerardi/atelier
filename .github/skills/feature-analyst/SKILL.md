---
name: feature-analyst
description: "Use when: a new feature is created, or functional requirements / user flow changes. Instructs the agent to create or update the feature's documentation in features/<slug>/. Do NOT activate for bugfixes, style changes, or refactors that do not alter user-facing behavior."
---

# Feature Analyst Skill

When a new feature is built or the functional requirements of an existing feature change, you **must** create or update the corresponding documentation folder under `features/`. Do this as part of the same work session — not as a follow-up.

---

## When to activate this skill

Activate when:

- A **new feature component** is created under `components/` (new folder with `index.tsx`)
- An **existing feature's user flow changes** — new interactions added, steps removed, behavior altered
- A **new server action or hook** is introduced that drives a user-facing flow

Do **not** activate for:

- Bugfixes where the observable behavior and user flow remain the same
- Style, layout, or refactor changes with no functional impact
- Adding Atelier frame states for behavior that already existed
- Internal code changes invisible to the user (renaming variables, extracting helpers, etc.)

---

## Steps

1. **Determine the feature slug** — kebab-case, matching the component folder name when possible (e.g. `components/ExampleSearchTab` → slug `example-search-tab`).

2. **Check if the folder exists** — look for `features/<slug>/`. If it does, you are updating; if not, you are creating.

3. **Load the templates** from [references/templates.md](./references/templates.md).

4. **Write or update the three files** in `features/<slug>/`:

   | File | Action |
   |------|--------|
   | `index.md` | Create from template. List every source file (components, actions, hooks) that belongs to this feature. |
   | `flow.md` | Build the `sequenceDiagram` from the actual code path. Use `User`, `Frontend`, `Backend` as the only participants. Number every arrow. Write the legend. Add a "Third-party notes" section only if an external service is involved. |
   | `frames.md` | List every `.atelier/mocks/*.frame.tsx` path related to this feature. If none exist yet, use the placeholder comment. |

5. **Tell the user** which files were created or updated and where.

---

## Diagram rules (summary)

- Participants: `User`, `Frontend`, `Backend` — no extras in `participant` declarations
- Number every arrow starting at `1`; use `->>` for actions, `-->>` for responses
- Labels ≤ 8 words; full explanation in the numbered legend below
- Use `alt` / `opt` for branches; continue numbering in sequence
- Third-party providers go in the "Third-party notes" prose section, not as diagram participants

---

## Hard rules

- Do **not** skip `flow.md` — the diagram is mandatory, not optional
- Do **not** fabricate file paths — only list source files you have verified exist
- Do **not** modify `features/` for bugfixes or style-only changes
- The `features/README.md` is the convention document — do not modify it unless the convention itself changes
