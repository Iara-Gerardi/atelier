---
id: example-card-avatar-skeleton-not-circle
created: 2026-05-12
fixed_in: components/ExampleCard.tsx
trigger: Missing `shrink-0` on skeleton avatar div caused flex container to compress its width
severity: low
status: pending_verification
---

## What broke
In the ExampleCard loading state, the avatar skeleton placeholder appeared as a tall oval/rounded rectangle instead of a circle.

## How to reproduce (before fix)
1. Open the ExampleCard preview in the Atelier workbench
2. Select the "Loading" state
3. Observe: the avatar placeholder is not circular — it appears as a narrow rounded rectangle

## What the agent should check
- [ ] Avatar skeleton is a perfect circle in the Loading state
- [ ] Avatar skeleton dimensions remain 48×48px (h-12 w-12)
- [ ] No layout regression in the Success state avatar

## Fix summary
Added `shrink-0` to the skeleton avatar `div` in `CardSkeleton`. Without it, the flex parent (`flex items-center gap-4`) was free to compress the element's width below its declared `w-12`, breaking the equal-sides requirement for `rounded-full` to render as a circle.
