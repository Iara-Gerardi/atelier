# Project graph and render coverage

Atelier builds a directed graph from TypeScript/JavaScript source and statically declared frames, scenes, variants, and feature contracts. Feature tags describe **where a frame is used**, with an evidence path; they are not exclusive ownership.

## Daily workflow

```sh
npm run atelier:scan
npm run atelier:watch
# Optional AI review of candidates whose dependency fingerprints changed:
npm run atelier:watch -- --review
```

The same `runProjectScan` function backs the CLI, watcher, and MCP `scan_project`. The watcher debounces edits, serializes scans, and excludes generated output to prevent feedback loops. It works for changes from people, agents, or merges. Agents follow `AGENTS.md` and `feature-analyst` after functional changes; no host-specific hook is required.

Generated, git-ignored artifacts:

| File | Content |
|---|---|
| `.atelier/generated/graph.json` | Source hashes, nodes, typed edges, render decisions, contracts and findings. |
| `.atelier/generated/features.json` | Catalog plus derived frame usages and evidence paths. |
| `.atelier/generated/report.json` | Changed files, affected artifacts, contract errors and coverage findings. |
| `.atelier/generated/reviews/` | Optional Jev decisions cached by candidate/dependency/model/question fingerprint. |
| `.atelier/coverage/` | Browser execution receipts per frame, state, variants and interaction plan. |

`npm run atelier:scan -- --check` is read-only and exits nonzero for a missing/stale local baseline or errors. It never advances the baseline. Run a write scan to establish a baseline on a fresh checkout. Warnings and unobserved branches do not fail this check; they require interpretation. `--json` returns the full report. `--root <directory>` selects a project.

## Graph semantics

- `contains`: a file or declaration contains another declaration/state/branch.
- `renders`, `calls`, `uses`: symbol-level runtime references, resolved using TypeScript, including aliases and barrel exports.
- `imports`, `type`: broader module/type dependencies used for invalidation, not feature tag propagation.
- `represents`: a frame renders the source component.
- `references`: a scene references its frames/states; an artifact depends on its declaration file.
- `variant`: a frame or scene depends on a global axis.
- `mocks`: a preview interceptor replaces a real module.
- `entry`: a feature declares its starting file/symbol or scene.

Feature traversal follows runtime/containment/reference relationships from explicit entries and respects exclusions. Imports alone never establish a feature usage. `trace_frame` in MCP returns the usage paths. Multiple features can reach a shared frame. Scene references establish declared screen relationships; imports and calls never create scene outcomes.

Impact traverses **reverse dependencies from both old and new graphs**, so deleted targets and removed edges still invalidate their consumers. Content and extractor-version fingerprints bind evidence to the source that produced it. Coverage fingerprints include the preview renderer and instrumenter; config and lockfile changes also invalidate evidence. Each scan currently rebuilds the static graph; affected-artifact selection and Jev review are incremental. A change in unrelated application source does not invalidate a frame's receipts.

## Feature catalog

Maintain one short contract in `features/<slug>/index.md`; see [the schema and examples](../features/README.md). The initial AI workflow is for a project with no catalog:

```sh
npm run atelier:catalog -- --preview --model <configured-provider-model>
npm run atelier:catalog -- --write --model <configured-provider-model>
```

A generative model proposes names, goals and exact entry symbols; Jev evaluates each proposed capability against the supplied source graph. The model honors Atelier's provider configuration. Jev uses `TYPESAFE_API_KEY` (or `JEV_API`), with optional `--review-model` and `--threshold`. `--proposal <json-file>` accepts an agent-authored JSON array for review. No credentials or environment files enter the prompt.

Schema/reference checks precede writing. Rejected proposals, malformed responses and source changes abort writes. Existing catalogs are never globally rediscovered; `feature-analyst` adds new entries incrementally. This repo's existing catalog has been migrated from its previous documentation; it does not require an AI bootstrap.

## Execution evidence

```sh
# Install the local test browser once if needed:
npx playwright install chromium

# Starts and closes an isolated instrumented Vite server automatically:
npm run atelier:coverage -- --frame ExampleForm --state idle
npm run atelier:coverage -- --plan qa/coverage/frame-smoke.json

# Or use an existing instrumented preview:
ATELIER_COVERAGE=1 npm run preview
npm run atelier:coverage -- --url http://localhost:5173 --frame ExampleForm
```

Without `--frame`, all frames and states are enumerated. Variant assignments are capped at eight per frame with explicit omission messages. `--settle-ms` sets an initial observation interval (default 150ms); it is not a claim that asynchronous UI has settled. Prefer assertions that wait for the intended result.

Plans are JSON arrays of `{ frame, state, variants?, settleMs?, steps? }`. Supported steps are `fill` (`selector`, `value`), `click` (`selector`), `wait` (`ms`), `assert-visible` (`selector`), and `assert-text` (`selector`, `text`). Selectors are scoped to the frame canvas. Every run uses a fresh browser context, isolating module-level mocks and pending work. Checkpoints retain cumulative branch hits after the initial observation and each step; they do not pretend to be complete render snapshots.

The preview-only transform records predicates in render-capable functions: `if`, ternaries, short-circuit expressions, switch cases and selected boolean JSX attributes. It returns the original value and evaluates expressions once. Branch identities use file, declaration scope, expression and occurrence; source hashes invalidate receipts after changes. Counts may include repeated or abandoned React render attempts, so use presence rather than exact hit counts for coverage.

The recorder checks that the preview server's graph matches the caller's checkout before and after capture. Loaded modules also register their raw source hashes, which the capture compares with the scanned snapshot. A different checkout, stale served module, or changed source cannot produce a receipt marked current. These provenance fields are stored with each receipt.

Receipts distinguish **executed**, **asserted**, and **failed**. `asserted` means the explicit checks passed, not that every possible visual outcome was verified. The report identifies stale receipts, states with no current execution, unasserted renders, unexecuted variant values and unobserved branch alternatives. Coverage of each value separately does not imply coverage of all variant combinations.

## Boundaries

Static extraction covers the repo's TS/TSX conventions and `.atelier/mocks`, `.atelier/scenes`, `.atelier/variants.ts`. The branch transform covers `components/`, `app/`, and their `src/` equivalents. Computed imports, dynamic metadata, arbitrary runtime component selection, CSS-only states and unmodeled dependencies are not proven complete; unresolved constructs are reported where detectable. Custom mock locations/alias conventions require an adapter.

Scene objects are parsed, never executed by the scanner. It checks frame/state references, outcome constraints, gate/fallback references, variants, and compatible mock exports. A valid graph does not prove a scene's runtime behavior; new or changed scenes still use `scene-coverage` and QA.

Self-healing is limited to generated indexes, derived tags and fresh reports. Source mocks, states, scenes, variants and feature boundaries remain explicit changes made using the reported evidence. No algorithm infers that an unseen branch is unreachable or that a new local state requires a new outcome/global variant.
