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

## What counts as a feature

A feature is a **user-facing capability** with a clear user goal, observable behavior, and a code surface that can be traced from entry point to outcome.

For this skill, a feature definition must include:

- **Goal**: what user problem it solves
- **Primary actor**: who uses it most (or which role)
- **Entry surface**: where it starts (`app/*` route/page/layout + feature entry component)
- **Behavior boundary**: what interactions are in scope vs out of scope
- **Owned surface**: the concrete files that implement it

Use these boundaries:

- **In scope**: user journeys, interaction rules, data fetch/mutation behavior, and cross-feature integrations that affect user flow
- **Out of scope**: pure refactors, internal helper extractions, naming cleanups, styling-only changes, and bugfixes that keep the same user flow

---

## Steps

1. **Determine the feature slug** — kebab-case, matching the component folder name when possible (e.g. `components/ExampleSearchTab` → slug `example-search-tab`).

2. **Check if the folder exists** — look for `features/<slug>/`. If it does, you are updating; if not, you are creating.

3. **Build a Feature Context Inventory before writing docs**:

   - **Entry points / pages**: every route, page wrapper, or layout touchpoint that can render this feature (`app/page.tsx`, `app/**/page.tsx`, `app/**/layout.tsx`, etc.)
   - **Core source files** grouped by type:
     - Components
     - Actions
     - Hooks
     - Utilities/helpers
     - Other supporting files (types, constants, adapters, schemas, configs)
   - **Atelier artifacts**: related `.atelier/mocks/*.frame.tsx` and `.atelier/scenes/*.scene.tsx`
   - **Cross-feature integrations**: where this feature composes, depends on, or is depended on by another feature (imports, shared hooks/actions, shared scenes, navigation handoffs)

4. **Apply evidence rules while building the inventory**:

   - Do **not** fabricate feature interactions
   - Every listed integration must be backed by code evidence (import/use/navigation/shared scene reference)
   - Every summary claim must map to at least one file in `index.md` source sections
   - Only list files you have verified exist

5. **Load the templates** from [references/templates.md](./references/templates.md).

6. **Write or update the four files** in `features/<slug>/`:

   | File | Action |
   |------|--------|
   | `index.md` | Create from template. Include feature definition, entry points/pages, source files (components/actions/hooks/utilities/supporting), integration notes, and traceability checklist. |
   | `flow.md` | Build the `sequenceDiagram` from the actual code path. Use `User`, `Frontend`, `Backend` as the only participants. Number every arrow. Write the legend. Add a "Third-party notes" section only if an external service is involved. |
   | `frames.md` | List every `.atelier/mocks/*.frame.tsx` path related to this feature. If none exist yet, use the placeholder comment. |
   | `scenes.md` | List every `.atelier/scenes/*.scene.tsx` path whose `nodes[*].frame` references at least one frame listed in `frames.md`. If none exist yet, use the placeholder comment. |

7. **Invoke `scene-coverage` if `scenes.md` is non-empty.** For each scene path listed there, load and follow `.github/skills/scene-coverage/SKILL.md` to emit qa cases under `qa/pending/`. The skill is idempotent — running it again after a no-op scene change is safe and produces zero new files.

8. **Tell the user** which files were created or updated and where, plus the count of qa cases emitted by `scene-coverage` (if invoked).

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
- Do **not** skip `scenes.md` — if the feature has no scenes yet, use the `<!-- no scenes yet -->` placeholder, do not omit the file
- Do **not** fabricate file paths or feature integrations — only list evidence-backed references
- Do **not** modify `features/` for bugfixes or style-only changes
- Do **not** write qa cases directly from this skill — always delegate to `scene-coverage`
- The `features/README.md` is the convention document — do not modify it unless the convention itself changes
