---
id: generate-frame-missing-states-declaration
created: 2026-05-23
fixed_in: ai/tools/frame-generator/normalize.ts
trigger: normalizer only accepted an exact `const states = { ... }` declaration and rejected equivalent AI output shapes
severity: medium
status: pending_verification
---

## What broke
`npm run gen-frame --src <Component>` could fail even when the model returned a valid frame structure, if the generated code used a different state object name (for example `const frameStates = {}` with `export default frameStates`) or used `export default { ... }` directly.

## How to reproduce (before fix)
1. Run the frame generator for a component (for example `npm run gen-frame --src ExampleForm`).
2. Have the model return a frame where the states object is not declared exactly as `const states = { ... }`.
3. Observe: generator exits with `Generated frame is missing const states = { ... }`.

## What the agent should check
- [ ] `normalizeFrameSource` accepts aliased state declarations exported as default.
- [ ] `normalizeFrameSource` accepts direct `export default { ... }` state object output.
- [ ] Final normalized frame still ends with `export default states` and typed `states` declaration.

## Fix summary
Expanded state declaration normalization in `normalize.ts` to support equivalent AI output forms: `states` declared via `const|let|var`, aliased exported identifiers, and direct `export default { ... }`. The normalizer now rewrites these into the canonical typed `const states` format instead of throwing a false-negative error.
