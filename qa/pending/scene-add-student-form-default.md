---
id: scene-add-student-form-default
created: 2026-05-24
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
- The scene renders the declared `fallback` node `notFound` inline — the URL preserves `node=form` so the user's intent is recoverable.
- `NotFound` renders at its `default` state.
- No outcomes are exposed (the user is at the fallback, not at the entry frame).

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=form` (no variant override). *(node.gateTrigger: "Navigate as a role without professor or admin access (e.g. auth=guest or auth=student)" — default auth=guest satisfies this.)*

## What the agent should check

- [ ] The visible frame is the 404 card from the `NotFound` mock.
- [ ] The URL `node` parameter still reads `form` (the redirect is inline; the entry node is preserved).
- [ ] No mocked-Button dropdown appears inside the rendered frame.
- [ ] Flipping `auth` to `professor` in the variant bar immediately swings the render back to `ExampleForm @ idle` without any other navigation.
