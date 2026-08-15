---
name: Add Student
slug: add-student
status: active
created: 2026-05-24
tags: [admin, form, demo]
---

## Summary

Add Student lets a professor or admin enroll a student by email. The form validates input, submits, and hands off to a status card that confirms success or surfaces a server error. It is the example app's reference multi-screen flow and exercises gates, frame-to-frame outcomes, and StateBar previews.

## Feature definition

- **Goal**: Enroll a student and confirm the result.
- **Primary actor**: Professor or admin (gated by the `auth` variant).
- **Entry points**: Atelier preview only (not routed).
- **In scope**: Email form, submit, success/error result screen, access gating.
- **Out of scope**: Student listing/editing; persistence beyond the demo handler.

## Source files

### Components
- `components/ExampleForm.tsx`
- `components/StatusCard.tsx`

## Global variants

- `auth` — the form node renders only for `professor` or `admin`; other roles are gated to `NotFound`.

## Integrations with other features

- None — the status hand-off stays within this feature.

## Traceability checklist

- [ ] Summary claim: access gated to professor/admin -> backed by `.atelier/scenes/AddStudent.scene.tsx` (gate)
- [ ] Summary claim: form → status hand-off -> backed by `.atelier/scenes/AddStudent.scene.tsx` (outcomes)
- [ ] Summary claim: success/error result -> backed by `.atelier/mocks/AddStudentStatus.frame.tsx`

## Feature docs
- [User flow](./flow.md)
- [Frame references](./frames.md)
- [Scene references](./scenes.md)
