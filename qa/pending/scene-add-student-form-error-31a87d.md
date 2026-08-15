---
id: scene-add-student-form-error-31a87d
created: 2026-05-24
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
outcome: error
trigger: Click the Submit button
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
- Clicking it does **not** submit the underlying form; the scene re-renders the **AddStudentStatus** frame at state `error`.
- The URL gains `frame=AddStudentStatus&state=error`; `node` still reads `form`.
- No variant values change (this outcome has no `set` clause).
- After dispatch, the StateBar lists `AddStudentStatus`'s states (`success`, `error`, `pending_review`).

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:professor`.
3. Open the split-button caret menu.
4. Click the `Go to error` item. *(outcome.trigger: "Click the Submit button")*

## What the agent should check

- [ ] Before the click, the rendered frame is `ExampleForm` at state `idle`.
- [ ] After the click, the URL reads `node=form&frame=AddStudentStatus&state=error` and the breadcrumb shows `form / AddStudentStatus @ error · via outcome`.
- [ ] The rendered card is the error card from `AddStudentStatus`.
- [ ] The StateBar now exposes `AddStudentStatus`'s full state set: `success`, `error`, `pending_review`. Picking `pending_review` switches the render in place.
- [ ] The variant bar still reads `auth=professor` (no `set` flipped values).
