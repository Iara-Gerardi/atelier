---
id: generate-scene-unknown-frame-rejected
created: 2026-05-24
fixed_in: ai/tools/scene-generator/normalize.ts
trigger: scene generator could emit nodes referencing frames that do not exist in .atelier/mocks/
severity: high
status: pending_verification
---

## What broke
`npm run gen-scene` (and the `generate_scene` MCP tool) could write a scene whose nodes or outcomes referenced a frame name the model hallucinated. The scene file would type-check but fail to resolve at preview time because no matching `*.frame.tsx` exists in the registry.

## How to reproduce (before fix)
1. Run `npm run gen-scene --name Checkout --entry-frame ExampleProductList`.
2. Have the model return a node with `frame: 'NonExistentFrame'`.
3. Observe: scene is written; opening it in Atelier fails to render the unknown node.

## What the agent should check
- [ ] `normalizeSceneSource` collects every `frame: '...'` reference and validates it against the live frame catalog built from `.atelier/mocks/`.
- [ ] Generation throws a clear error listing the unknown frame name(s) and the known frame names before any file is written.
- [ ] A scene that references only catalog frames passes normalization unchanged.

## Fix summary
Added `assertKnownFrames` to `normalize.ts`. After enforcing the type import, typed meta, typed `scene` declaration, and default export, the normalizer extracts all `frame:` references and throws if any are not present in the catalog passed from `run.ts`. This catches hallucinated frame names at generation time rather than at preview time.
