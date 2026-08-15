---
id: scene-add-student-not-found-default
created: 2026-05-24
source_scene: .atelier/scenes/AddStudent.scene.tsx
node: notFound
expected_frame: NotFound
expected_state: default
variants:
  auth: guest
severity: medium
status: pending_verification
---

## What this case verifies

Arriving directly at the `notFound` node of the `AddStudent` scene (the fallback target):
- `NotFound` renders at its `default` state regardless of `auth` (the node has no gate and the frame opts into no variant axes).
- The node declares no outcomes, so no mocked-Button split dropdown appears.
- The StateBar lists only `NotFound`'s single `default` state.

## How to reach this state

1. Open the Atelier preview.
2. Navigate to `?scene=AddStudent&node=notFound`.

## What the agent should check

- [ ] The visible frame is the 404 card from the `NotFound` mock.
- [ ] The breadcrumb reads `notFound / NotFound @ default`.
- [ ] The StateBar lists exactly one state: `default`.
- [ ] No split-button dropdown is rendered (the node has no outcomes).
- [ ] Changing `auth` in the variant bar does not change what renders (NotFound opts into no axes).
