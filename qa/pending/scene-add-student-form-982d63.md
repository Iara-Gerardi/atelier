---
id: scene-add-student-form-982d63
created: 2026-05-24
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: form
expected_frame: NotFound
expected_state: default
variants:
  auth: student
severity: medium
status: pending_verification
---

## What this case verifies

Arriving at the `form` node of the `AddStudent` scene with `{ auth: 'student' }`:
- The gate `auth === 'professor' || auth === 'admin'` fails for a student.
- The scene renders the declared `fallback` node `notFound` inline; the URL preserves `node=form`.
- `NotFound` renders at its `default` state.
- No outcomes are exposed.

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form&v=auth:student`. *(node.gateTrigger: "Navigate as a role without professor or admin access (e.g. auth=guest or auth=student)".)*

## What the agent should check

- [ ] The visible frame is the 404 card from the `NotFound` mock.
- [ ] The URL `node` parameter still reads `form`.
- [ ] No mocked-Button dropdown appears inside the rendered frame.
- [ ] Flipping `auth` to `admin` in the variant bar immediately swings the render back to `ExampleForm @ idle`.
