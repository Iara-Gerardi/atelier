 # Atelier internal docs

Short, agent- and human-readable notes about why Atelier exists, what is built, and how we work. Keep every file in this folder under ~60 lines — these are orientation notes, not specs.

| File | Read it when you want to know… |
|------|--------------------------------|
| [vision.md](./vision.md) | What Atelier is, the thesis, and the four pillars that define "done". |
| [state.md](./state.md) | What already exists in the repo today (inventory + gaps). |
| [conventions.md](./conventions.md) | Dev preferences, file structure, and the strict doc size budgets. |
| [portability.md](./portability.md) | How Atelier drops into other projects: npm-package plan, AI-provider setup, per-tool agent placement. |

## Related docs (not in this folder)

- Feature docs live in `features/<slug>/` (4 files each — see [conventions.md](./conventions.md)).
- Agent skills live in `.github/skills/`; agents in `.github/agents/`.
- QA cases live in `qa/`; the workbench mechanics are described in the root `README.md` and `AGENTS.md`.
