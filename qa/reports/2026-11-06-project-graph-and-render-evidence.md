# QA Run Report

Suite/Case: project-graph-and-render-evidence
Run date: 2026-11-06
Agent: qa-agent source review; Codex completed the final runtime receipt verification and report.

## Results

| Check | Result | Evidence |
|---|---|---|
| Runtime paths determine feature membership | PASS | `graph.test.ts` resolves barrel aliases and excludes unused/type imports. |
| Shared frames retain multiple usage paths | PASS | Two-feature fixture and generated Pagination usages. |
| Deleted dependencies invalidate prior consumers | PASS | Deletion test checks affected frame, scene and mock. |
| Check mode preserves the baseline | PASS | Baseline bytes unchanged after read-only check. |
| Jev review is cached by relevant dependencies | PASS | Provider-spy test checks reuse and relevant-change invalidation. |
| Bootstrap preserves existing catalogs | PASS | Preview/write/existing-contract tests. |
| Instrumentation preserves predicate semantics | PASS | Negation, short-circuit, nullish, switch and name-collision regressions. |
| Execution contexts isolate mocks | PASS | `captureFrame` creates and closes a new context per plan. |
| Assertions are distinguished from branch hits | PASS | Receipt statuses and explicit assertion steps. |
| Coverage invalidation follows dependencies | PASS | Unrelated-source and preview/instrumenter-change tests. |
| Smoke plan validates visible outcomes | PASS | Three current schema-v2 receipts, five assertions, no errors. |
| Feature workflow uses one compact contract | PASS | Six migrated showcase contracts plus tooling contract; redundant inventories removed. |

## Verification

- 30 tests passed across the project-graph and state-manifest suites.
- Tooling TypeScript check and `npm run typecheck` passed.
- `npm run atelier:scan -- --check` passed with zero changed files and no contract errors.
- `git diff --check` passed.
- Browser smoke: `ExampleForm/idle` as guest submitted successfully (two assertions); `ExampleForm/error` as professor displayed the expected error (one assertion); `StatusCard/success` displayed confirmation (two assertions).
- Each receipt registered 52 loaded source modules; all three dependency fingerprints match current source.

The source review found two issues during verification: preview provenance was not initially checked against the caller's checkout, and the instrumentation helper could be shadowed by application bindings. Both were corrected and covered by regressions before the final passing run. Renderer/instrumenter source changes now invalidate receipts as well.

## Scope and limitations

These executions are smoke coverage, not an exhaustive verification of every frame/state/variant combination. Unobserved branches are reported as missing evidence, never as unreachable states. The provider's computed import remains a reported static-analysis limitation. Jev integration tests use simulated provider responses; no live AI validation result is asserted here.

## Summary

Cases checked: 1
All pass: 1 | Has failures: 0 | Needs human: 0

## Cases ready for promotion

- project-graph-and-render-evidence

## Cases with failures

None. The case remains in `qa/pending/` with `ready_for_promotion`; it has not been moved to `verified/`.
