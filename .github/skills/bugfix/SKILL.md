---
name: bugfix
description: "Use when: applying a fix to any bug, regression, or broken behavior reported by the user. This skill instructs the agent to document the fix in qa/pending/ immediately after the change is made."
---

# Bugfix Documentation Skill

After **every** fix you apply to source code in response to a reported bug, you **must** create a case file in `qa/pending/`. This is non-negotiable — do it before responding to the user.

---

## When to activate this skill

Activate this skill whenever the user:
- Describes broken behavior ("X is not working", "Y shows a blank state", "Z crashes when…")
- Reports a regression
- Asks you to fix something visual or behavioral

---

## Steps

1. **Identify the fix** — which files changed, what was the root cause.
2. **Apply the fix** in source code.
3. **Immediately create** `qa/pending/<slug>.md` using the template below. This case captures the *fix-specific* regression — keep it narrow and focused on the broken behavior.
4. **Refresh scene coverage for the affected area.** For each component file changed by the fix:
   - Find its frame name (from the `meta.name` in `.atelier/mocks/<ComponentName>.frame.tsx`).
   - Search `features/*/scenes.md` for files that reference scenes containing that frame. Read each candidate `.atelier/scenes/*.scene.tsx` and confirm `nodes[*].frame` includes the frame name.
   - For each matching scene, load and follow `.github/skills/scene-coverage/SKILL.md` to refresh `qa/pending/` cases for that scene. The skill is idempotent — existing cases will not be overwritten.
5. **Tell the user** the fix is in place, that a fix-specific QA case was written to `qa/pending/<slug>.md`, and how many additional scene-coverage cases (if any) were emitted as a result of the refresh.

---

## File template

```markdown
---
id: <slug>
created: <YYYY-MM-DD>
fixed_in: <relative/path/to/file.tsx>
trigger: <one-line root cause>
severity: <low|medium|high|critical>
status: pending_verification
---

## What broke
<Describe the broken behavior as observed by the user.>

## How to reproduce (before fix)
1. <Step>
2. <Step>
3. Observe: <what went wrong>

## What the agent should check
- [ ] <Behavioral check 1>
- [ ] <Behavioral check 2>
- [ ] <Edge case>

## Fix summary
<What you changed and why it resolves the issue.>
```

---

## Slug rules

- kebab-case
- Format: `<component>-<symptom>`
- Examples: `home-pagination-loading-state`, `search-tab-empty-state-crash`
- Must be unique within `qa/pending/` + `qa/verified/` + `qa/archived/`

---

## Severity guide

| Severity | When to use |
|----------|-------------|
| `critical` | App crashes or data is lost |
| `high` | Core user flow is broken |
| `medium` | Degraded experience, workaround exists |
| `low` | Visual glitch or minor UX issue |

---

## Hard rules

- Write the case file **before** reporting success to the user.
- Do **not** skip this step if the fix is "obvious" or "small".
- Do **not** write to `verified/` — only the qa-agent promotes cases.
- Do **not** delete existing case files.
- Do **not** write scene-derived cases by hand from this skill — always delegate the breadth coverage to `scene-coverage`. The fix-driven case stays narrow; scene-coverage owns the rest.
