---
id: scene-add-student-form-success-c85aa8
created: 2026-05-24
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
outcome: success
trigger: Click the Submit button
expected_frame: AddStudentStatus
expected_state: success
variants:
  auth: admin
severity: medium
status: pending_verification
---

## What this case verifies

Starting at the `form` node with `{ auth: 'admin' }` and dispatching the `success` outcome:
- The mocked Button's dropdown contains a `Go to success` menu item (badged "Default") targeting `AddStudentStatus@success`.
- Clicking it re-renders the **AddStudentStatus** frame at state `success` rather than submitting the form.
- The URL gains `frame=AddStudentStatus&state=success`; `node` still reads `form`.
- No variant values change (no `set` clause).
- After dispatch, the StateBar lists `AddStudentStatus`'s states (`success`, `error`, `pending_review`).

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:admin`.
3. Use the split-button primary face (or caret menu) `Go to success`. *(outcome.trigger: "Click the Submit button")*

## What the agent should check

- [ ] Before the click, the rendered frame is `ExampleForm` at state `idle`.
- [ ] After the click, the URL reads `node=form&frame=AddStudentStatus&state=success` and the breadcrumb shows `form / AddStudentStatus @ success · via outcome`.
- [ ] The rendered card is the success card from `AddStudentStatus`.
- [ ] The StateBar now exposes `AddStudentStatus`'s full state set: `success`, `error`, `pending_review`.
- [ ] The variant bar still reads `auth=admin` (no `set` flipped values).
