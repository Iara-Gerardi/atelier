# Complex application readiness

This review tests Atelier's current frame, scene, variant, manifest, and coverage model against a representative application with authenticated routes, localized UI, asynchronous data, persistent preferences, a spatial editor, and live collaboration. The cases below are generic; they describe product capabilities Atelier should support across projects.

## What already works

- Frames, scenes, and global variants provide a useful visual catalog. The project graph traces dependencies and invalidates stale execution evidence.
- Browser coverage distinguishes executed renders from asserted results and reports omitted variant assignments and unobserved branches. These are useful signals, but they are not proof that a UI state or interaction is complete.

A read-only probe of four representative components found both missed and noisy candidates: a debounced search view yielded only `default`, an access gate yielded `error` and `default`, and a data list yielded a role literal while omitting empty and loading states. This was the deterministic extraction stage, without AI validation; it demonstrates a discovery limit, not a completed coverage audit.

## Gaps and improvements

| Priority | Generic case and current failure mode | Improvement and acceptance check |
|---|---|---|
| P0 | A search view changes among initial content, pending, results, empty, throttled, and failed states. The one-file state extractor can emit only `default` when conditions are derived from values and hooks instead of literal unions. | Discover render-affecting inputs across imported hooks, child components, props, and data shapes. Show a trace from each proposed state to its condition; flag unexplained branches. A manifest for this case must distinguish those visible outcomes. |
| P0 | An access gate depends on identity, entitlement, resource permission, request status, and redirect destination together. Separate axis coverage can miss the combination that exposes a wrong screen. | Add constrained scenario definitions with valid and invalid combinations, pairwise sampling by default, explicit high-risk combinations, and a clear count of omitted cases. A receipt must identify the full assignment, not just individual values. |
| P0 | A component reads context, URL parameters, browser storage, a store, and API data before it can render. Today a frame mainly supplies JSX and setter calls, so setup is scattered or a preview silently uses unrealistic defaults. | Add a typed fixture lifecycle: providers, route/query, storage, clock, network responses, and store seeds with teardown and source provenance. A frame should reproduce the same state in a fresh browser context and after reload. |
| P0 | Clicking a primary control can open a local panel, submit a form, or navigate. The scene Button interceptor replaces every primary face with a generic outcome control and suppresses real handlers; the StateBar changes local states without exercising the action. | Bind outcomes to named actions or selectors, keep the original control and accessible name, and model local transitions as testable interactions. Verify that unrelated controls still work and that a recorded action reaches the expected state. |
| P0 | A project's button primitive uses a different module path, variant names, or styles. Atelier's current Button mock hardcodes all three, so a default action may not dispatch and the preview can misrepresent the shipped control. | Make action interception an adapter around the project's real primitive, with explicit action selection and API compatibility checks. Verify default, secondary, disabled, and submit controls against the host component. |
| P1 | A route uses server rendering, framework navigation, localization, and app-level providers. The built-in preview shims cover only a small set of Next modules, while URL and locale may be read through other packages. | Provide pluggable framework adapters and a route-level preview boundary. Detect missing providers or unsupported modules during scan and explain the required adapter. Verify both client and server-derived render paths. |
| P1 | A spatial editor responds to drag, pan, pinch, keyboard shortcuts, focus, and breakpoint changes. Coverage currently supports click, fill, wait, and two DOM assertions at a fixed desktop viewport. | Add viewport and input-capability fixtures plus pointer, drag/drop, wheel, keyboard, focus, and touch steps. Assert geometry, focus, and accessibility state where relevant. Run a mobile and desktop plan for the same frame. |
| P1 | An async request can resolve late, fail, retry, or race with a newer request; a live connection can sync, disconnect, and reconnect. Fixed waits and static mock setters do not express event order. | Add controllable promises, fake time, network/event scripts, and explicit settle conditions. Capture a timeline of state changes so stale-response and reconnect scenarios are repeatable. |
| P1 | Two users edit the same resource and see different permissions, presence, or conflict states. A fresh single-page context per run isolates state but cannot test cross-client behavior. | Support named actors with separate browser contexts and a shared deterministic event source. Assert each actor's visible state and the order of propagated changes. |
| P1 | A branch executes and a text assertion passes while the screen is visually broken, clipped, or inaccessible. Current receipts do not capture visual or accessibility evidence. | Attach stable screenshots, DOM/accessibility snapshots, console and network errors, and viewport metadata to checkpoints. Separate visual, behavioral, and branch coverage in reports. |
| P2 | Every component under `components/` is expected to have a frame, including small nested pieces that are meaningful only inside a parent. Eager registry loading and per-state runs grow with the project. | Define frame eligibility and composition rules, retain traceability for unframed children, and load registry entries on demand. Report catalog size, run cost, and uncovered visual surfaces without treating every helper as a standalone story. |

## Self-healing boundary

Atelier currently refreshes generated indexes and invalidates stale receipts; it does not safely repair authored fixtures, scenes, or assertions. A future healing loop should propose a minimal patch from changed source and failed evidence, rerun the affected cases, and keep a reviewable before/after diff. It must never turn a failing assertion green by deleting it or accepting a new visual baseline without an explicit decision.

## Suggested order

1. Build scenario fixtures and constrained state discovery together; they define which states can be reached.
2. Preserve real controls and add interaction coverage, then expand browser inputs and asynchronous timelines.
3. Add framework adapters, multi-actor runs, and visual evidence before claiming broad self-healing.

The first end-to-end milestone is a frame whose visible state depends on a provider, request result, stored preference, and viewport: it should open directly, replay deterministically, and yield an asserted receipt with any untested combinations listed.
