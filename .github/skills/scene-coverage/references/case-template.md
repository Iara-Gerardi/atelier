# Scene-Derived qa Case Template

Use these templates verbatim when emitting qa cases from a scene. Three shapes exist:

- **Node-arrival case** — verifies what a user sees when landing on a node with a given variant assignment.
- **Outcome case** — verifies that firing a specific outcome from a node re-renders the right (frame, state) and applies any `set`.
- **Redirect case** — verifies that a failing gate at the initial node redirects to the declared `fallback`.

All three shapes share the same front-matter contract.

---

## Front-matter fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Computed per the naming rule in the skill (`scene-<sceneSlug>-<nodeId>[-<outcomeId>]-<varHash>`). Globally unique across `qa/pending/`, `qa/verified/`, `qa/archived/`. |
| `created` | yes | `YYYY-MM-DD`. |
| `source_scene` | yes | Workspace-relative path to the `.scene.tsx` file. Lets future runs trace cases back to their spec. |
| `node` | yes | Entry node id for the case. |
| `outcome` | only for outcome cases | The outcome id being dispatched. Omit otherwise. |
| `expected_frame` | yes | Frame name expected to render after gate evaluation and (if applicable) outcome dispatch. |
| `expected_state` | yes | State key expected on `expected_frame` after the dispatch. For node-arrival cases this is the node's declared state; for outcome cases it is `outcome.state`. |
| `variants` | yes | YAML map of the variant assignment at the **entry** node. Always list every axis explicitly (defaults included) so the case is self-contained. |
| `severity` | yes | Always `medium` for scene-derived cases. (Fix-driven cases set their own severity; scene coverage is uniformly medium because it documents expected behavior.) |
| `status` | yes | Always `pending_verification` on creation. |

---

## Node-arrival case

```markdown
---
id: scene-add-student-form-7c1abf
created: <YYYY-MM-DD>
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
expected_frame: ExampleForm
expected_state: idle
variants:
  auth: professor
severity: medium
status: pending_verification
---

## What this case verifies

Arriving at the `form` node of the `AddStudent` scene with `{ auth: 'professor' }`:
- The gate `auth === 'professor' || auth === 'admin'` passes, so no redirect.
- The `ExampleForm` frame renders at state `idle` without throwing.
- The StateBar at the top of the canvas lists every state declared by `ExampleForm` (`idle`, `loading`, `error`, `success`).
- The form's submit button is replaced by the mocked `@/components/ui/Button` split dropdown.
- The primary face reads "Go to success" (the `default: true` outcome).
- The dropdown lists `Go to success` (badged "Default") and `Go to error`, each with their target frame@state hint and `description` subtitle.

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:professor`.

## What the agent should check

- [ ] No 404 card is rendered (the gate passed).
- [ ] The breadcrumb above the frame reads `form / ExampleForm @ idle`.
- [ ] The StateBar exposes every state of `ExampleForm`: `idle`, `loading`, `error`, `success`.
- [ ] The submit area renders a split-button dropdown with `data-atelier-scene-action="true"`.
- [ ] The primary face label is literally `Go to success` — the form's original "Get early access" copy is suppressed.
- [ ] Opening the caret menu lists exactly two items: `Go to success` (badged "Default") and `Go to error`. Both items show the `AddStudentStatus@<state>` hint.
- [ ] Picking `error` in the StateBar updates the URL to `&frame=ExampleForm&state=error` without dispatching any outcome.
- [ ] Flipping `auth` to `guest` in the variant bar immediately renders the `NotFound` frame inline; the URL still reads `node=form` (the scene preserves the user's intent).
```

---

## Outcome case

```markdown
---
id: scene-add-student-form-error-7c1abf
created: <YYYY-MM-DD>
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
outcome: error
expected_frame: AddStudentStatus
expected_state: error
variants:
  auth: professor
severity: medium
status: pending_verification
---

## What this case verifies

Starting at the `form` node with `{ auth: 'professor' }` and dispatching the `error` outcome:
- The mocked Button's dropdown contains a `Go to error` menu item targeting `AddStudentStatus@error`.
- Clicking it does **not** submit the underlying form; instead the scene re-renders the **AddStudentStatus** frame at state `error`.
- The URL gains `frame=AddStudentStatus&state=error`; `node` still reads `form` (the entry node is sticky).
- No variant values change (this outcome has no `set` clause).
- After dispatch, the StateBar now lists `AddStudentStatus`'s states (`success`, `error`, `pending_review`), so the user can preview the non-outcome `pending_review` state without going back through the dropdown.

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:professor`.
3. Open the split-button caret menu.
4. Click the `Go to error` item.

## What the agent should check

- [ ] Before the click, the rendered frame is `ExampleForm` at state `idle`.
- [ ] After the click, the URL reads `node=form&frame=AddStudentStatus&state=error` and the breadcrumb shows `form / AddStudentStatus @ error · via outcome`.
- [ ] The rendered card is the rose-toned "Could not add student" error card from `AddStudentStatus`.
- [ ] The StateBar now exposes `AddStudentStatus`'s full state set: `success`, `error`, `pending_review`. Picking `pending_review` switches the render in place without any URL change beyond `state=pending_review`.
- [ ] The variant bar still reads `auth=professor` (no `set` flipped values).
- [ ] Clicking "Restart" returns to `ExampleForm @ idle` and drops `frame` and `state` from the URL.
```

---

## Redirect case

```markdown
---
id: scene-add-student-form-default
created: <YYYY-MM-DD>
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
expected_frame: NotFound
expected_state: default
variants:
  auth: guest
severity: medium
status: pending_verification
---

## What this case verifies

Arriving at the `form` node of the `AddStudent` scene with default variants `{ auth: 'guest' }`:
- The gate `auth === 'professor' || auth === 'admin'` fails.
- The scene renders the declared `fallback` node `notFound` inline — but the URL preserves `node=form` so the user's intent is recoverable.
- `NotFound` renders at its `default` state.
- No outcomes are exposed (the user is at the fallback, not at the entry frame).

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form` (no variant override, so `auth=guest`).

## What the agent should check

- [ ] The visible frame is the 404 card from the `NotFound` mock.
- [ ] The URL `node` parameter still reads `form` (the redirect is inline; the entry node is preserved).
- [ ] The breadcrumb shows `form → notFound · gate failed`.
- [ ] No mocked-Button dropdown appears inside the rendered frame (the NotFound frame has no submit, and the SceneCanvas provides empty outcomes during a fallback render).
- [ ] Flipping `auth` to `professor` in the variant bar immediately swings the render back to `ExampleForm @ idle` without any other navigation.
```

---

## When the outcome carries a `set`

When `outcome.set` is non-empty (e.g. `set: { auth: 'admin' }`), the checklist must include a check that the listed variant axes update after the dispatch:

```markdown
- [ ] After dispatching the outcome, the `auth` variant in the top bar reads `admin`.
```

The case's `variants` front-matter still records the **entry** assignment (pre-dispatch). The post-dispatch values are described in the body.

---

## Rules

- One case per file. Do not bundle multiple outcomes or nodes into a single case.
- The checklist must use `- [ ]` checkboxes (the qa-agent counts them).
- Every check item must be independently verifiable by reading source or running the preview — no compound checks.
- Do not link to other cases. Each case stands alone.
- Do not edit `source_scene` after creation. If the scene moves or is renamed, archive the case and let `scene-coverage` emit a fresh one.
- The dropdown checklist should reference outcomes as **"Go to <id>"** items, not bare ids. Same for the primary face. This matches what the user sees in the preview.
- Outcome cases must include at least one check that asserts the *new* StateBar contents (the target frame's full state list), not just the dispatched state.
