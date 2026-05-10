# QA — Bug Tracking Convention

This folder is **agent-managed and human-reviewable**. It tracks bugs that the agent has fixed, not yet fixed, and has verified.

---

## Folder layout

```
qa/
├── README.md          ← this file
├── pending/           ← agent writes here immediately after every fix
├── verified/          ← move here once the fix is confirmed to hold
├── archived/          ← closed / prunable cases (do not delete)
└── suites/            ← test suite definitions (smoke, full, regression, …)
```

---

## Lifecycle of a bug case

```
[bug mentioned] → agent fixes → writes to pending/
                                        ↓
                              qa-agent runs suite / targeted check
                                        ↓
                         all checks pass → flagged "ready_for_promotion"
                                        ↓
                         human or agent moves file → verified/
                                        ↓
                         no longer relevant → archived/
```

---

## File naming

Use kebab-case descriptive slugs that capture component + symptom:

```
<component>-<symptom>.md
home-pagination-loading-state.md
search-tab-empty-state-crash.md
badge-overflow-truncation.md
```

---

## Front-matter fields

| Field | Values | Required |
|-------|--------|----------|
| `id` | Same as filename (no `.md`) | yes |
| `created` | `YYYY-MM-DD` | yes |
| `fixed_in` | Relative file path(s) touched | yes |
| `trigger` | One-line description of root cause | yes |
| `severity` | `low` \| `medium` \| `high` \| `critical` | yes |
| `status` | `pending_verification` \| `ready_for_promotion` \| `needs_human` | yes |

---

## Agent rules

1. **Always write to `qa/pending/` immediately after applying a fix** — not after verifying, not conditionally.
2. Never delete files — move to `archived/` instead.
3. Mark ambiguous checks as `needs_human`, never guess a pass.
4. The qa-agent does **not** promote cases unilaterally — it sets `status: ready_for_promotion` and stops.

---

## Suites

Suite definitions live in `qa/suites/`. Each suite is a Markdown file that declares which cases to run and what the qa-agent should look for.

Available suites:

| File | Purpose |
|------|---------|
| [`suites/smoke.md`](./suites/smoke.md) | High/critical severity pending cases — fast confidence check |
