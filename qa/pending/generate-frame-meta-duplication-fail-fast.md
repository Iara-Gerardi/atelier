---
id: generate-frame-meta-duplication-fail-fast
created: 2026-05-24
fixed_in: ai/tools/frame-generator/normalize.ts
trigger: normalizer appended a second `meta` block for typed meta output and the runner silently generated fallback frames after upstream failures
severity: high
status: pending_verification
---

## What broke
`generate-frame` could produce invalid frame files with duplicate `export const meta` declarations, and generation failures could still result in a written fallback frame instead of failing fast.

## How to reproduce (before fix)
1. Run `npm run gen-frame -- --src ExampleForm`.
2. Observe generated output where typed `meta` already exists in model output.
3. Observe: normalizer appends another `meta` export or runner writes fallback output even when model call fails.

## What the agent should check
- [ ] Normalization keeps exactly one `export const meta` declaration even when model output includes typed meta.
- [ ] Duplicate `meta` declarations emitted by model output are reduced to one canonical typed `meta`.
- [ ] Write mode does not create/update output files when generation or normalization throws.
- [ ] Runner logs include `called from` origin (`cli`, `mcp`, or `tool`) at start.

## Fix summary
Updated `normalizeFrameSource` to use a unified typed/untyped `meta` matcher, canonicalize the first `meta`, remove duplicate `meta` exports, and enforce an exactly-one-meta invariant. Updated `runGenerateFrame` to fail fast by removing template fallback generation and only writing files after successful generation + normalization. Added minimal `called from` logging and wired invoker origin from CLI, MCP, and tool entry points.
