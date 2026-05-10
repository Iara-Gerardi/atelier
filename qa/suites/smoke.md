## Smoke Suite

Run all cases in `qa/pending/` where:
- `severity: high` OR `severity: critical`
- `status: pending_verification`

For each matched file, execute the checklist under `## What the agent should check`.

---

## Report format

One line per check item, then a summary block:

```
[PASS] Loading skeleton appears during fetch
[FAIL] Cards render correctly after fetch resolves
[PASS] Rapid page changes don't leave UI in broken state
[NEEDS-HUMAN] Edge case: page 1 on cold load behaves identically

---
Suite: smoke
Run date: YYYY-MM-DD
Cases checked: 3
Pass: 2 | Fail: 1 | Needs-human: 1
```

---

## Promotion rule

If **all** checks are `PASS` or `NEEDS-HUMAN` (none are `FAIL`), update the case file:

```
status: ready_for_promotion
```

Do **not** move the file — flag only.
