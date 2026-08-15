---
id: scene-add-student-form-31a87d
created: 2026-05-24
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
- The StateBar lists every state declared by `ExampleForm` (`idle`, `loading`, `error`, `success`).
- The form's submit button is replaced by the mocked `@/components/ui/Button` split dropdown.
- The primary face reads "Go to success" (the `default: true` outcome).
- The dropdown lists `Go to success` (badged "Default") and `Go to error`, each with their target frame@state hint.

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:professor`.

## What the agent should check

- [ ] No 404 card is rendered (the gate passed).
- [ ] The breadcrumb above the frame reads `form / ExampleForm @ idle`.
- [ ] The StateBar exposes every state of `ExampleForm`: `idle`, `loading`, `error`, `success`.
- [ ] The submit area renders a split-button dropdown with `data-atelier-scene-action="true"`.
- [ ] The primary face label is literally `Go to success`.
- [ ] Opening the caret menu lists exactly two items: `Go to success` (badged "Default") and `Go to error`; both show the `AddStudentStatus@<state>` hint.
- [ ] Picking `error` in the StateBar updates the URL to `&frame=ExampleForm&state=error` without dispatching any outcome.
- [ ] Flipping `auth` to `guest` immediately renders the `NotFound` frame inline; the URL still reads `node=form`.
