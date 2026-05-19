---
name: scene-coverage
description: "Use when: a scene file in .atelier/scenes/ is created or modified, when documenting a feature whose scenes.md is non-empty, or when extending qa coverage around a bugfix that touches a component referenced by a scene. Translates a scene's nodes + outcomes into qa case files under qa/pending/."
---

# Scene Coverage Skill

Scenes in `.atelier/scenes/*.scene.tsx` are the canonical screen-level spec for user flows in this workspace. This skill is how those specs become testable qa cases under `qa/pending/`. The `qa-agent` then runs them like any other case.

You do this by reading the scene file, resolving everything it references, enumerating the per-node outcomes, and writing one case file per (node[, outcome], variant-combo). No code is executed — the agent does the symbolic enumeration.

---

## When to activate this skill

Activate when:

- A scene file under `.atelier/scenes/` is **created or modified** in this session.
- The `feature-analyst` skill writes or updates a `features/<slug>/scenes.md` that lists at least one scene.
- The `bugfix` skill identifies that the affected component is referenced by a scene (`nodes[*].frame` matches the component's frame name, or appears in any `outcome.frame`).
- The user explicitly asks to "generate qa cases for scene X" or "refresh scene coverage".

Do **not** activate when:

- A frame is changed but no scene references it.
- A scene's only change is a `description` field or a comment.
- The user is mid-edit on the scene file (wait until the change settles).

---

## Inputs

You will be invoked with one of:

| Input | Behavior |
|-------|----------|
| A scene file path (`.atelier/scenes/AddStudent.scene.tsx`) | Cover that single scene. |
| A `features/<slug>/scenes.md` file | Cover every scene listed inside. |
| A component file path | Resolve to the frame at `.atelier/mocks/<ComponentName>.frame.tsx`, find scenes whose `nodes[*].frame` or `outcomes[*].frame` matches, cover each. |

---

## Steps

### 1. Read everything the scene depends on

In order:

1. The scene file itself — `meta` + `default` export (`initial`, `nodes`).
2. For each unique frame referenced (every `node.frame` and every `outcome.frame`), read `.atelier/mocks/<name>.frame.tsx` to confirm the named state exists in `default` and to collect `meta.variants`. Also note the **full list of states** declared on each referenced frame — the StateBar exposes them all, but only the subset declared as outcomes is reachable via the dropdown.
3. `.atelier/variants.ts` — to know the axes, allowed values (with their `label` + `description`), and defaults.

If any reference is broken (unknown frame, missing state, unknown variant axis or value), **stop and report the inconsistency**. Do not emit cases for a broken scene.

Additional sanity check unique to v3: every `outcome.frame` **must differ from** its parent `node.frame`. Outcomes are frame transitions, not state changes. If you see `outcome.frame === node.frame`, surface a warning and skip that outcome — it would never reach the dropdown at runtime.

### 2. Identify the variant axes that matter for this scene

A scene "cares about" an axis iff at least one of the following references it:

- A node's `gate` function (read the source — any `variants.<axis>` access).
- An `outcome.set` object (any key present there).
- Any reachable frame's `meta.variants` (visual behavior of that frame depends on it).

Other axes stay at their defaults during enumeration — this keeps the combinatorial blowup bounded.

### 3. Enumerate node arrivals + outcomes

There is no graph walk in v3 — outcomes don't change the active node, only the rendered (frame, state). Gates can redirect node arrivals to a fallback node.

For every node `N` in `scene.nodes`:

1. For every relevant variant assignment `V` (axes from step 2, cartesian product of values, defaults for the rest):
   1. Symbolically evaluate `N.gate(V)` (or treat as `true` if no gate).
   2. If false:
      - If `N` is the scene's `initial` node, emit a **redirect case** for that `(N, V)`: arriving at `N` under `V` should immediately render `N.fallback`'s frame inline (URL keeps `node=N`; no navigation happens).
      - If `N` is not the initial node, the redirect is implicit elsewhere — skip.
   3. If true, emit a **node-arrival case**: at `N` with `V` the rendered frame should be `N.frame` at state `N.state`; the StateBar should list every state of `N.frame`; the mocked `@/components/ui/Button` should render a split dropdown listing exactly the outcomes whose `frame !== N.frame` (in v3 that's all of them) as "Go to <id>" items.
   4. For every `outcome` in `N.outcomes` (when gate passed) emit one **outcome case**: dispatching `outcome` from `N` under `V` should re-render the frame at `(outcome.frame, outcome.state)`, flip variants per `outcome.set`, and after dispatch the StateBar should list all states of `outcome.frame` — including states that are NOT declared as outcomes of any node (they're "preview-only" states reachable via the StateBar).

Bounds:

- Cap the value-combo cartesian product at **8 combinations per node**. If a node's relevant axes have more, emit cases only for the gate-distinguishing combos and the defaults, and warn the user.
- Cap total cases at **32 per scene per run**. If you'd exceed it, prioritize node-arrival cases over outcome cases and report the truncation.

### 4. Compute each case id

Format: `scene-<sceneSlug>-<nodeId>[-<outcomeId>]-<varHash>`

- `sceneSlug`: kebab-case of `scene.meta.name`.
- `nodeId`: the node the case starts from.
- `outcomeId`: present only for outcome cases. Omitted for node-arrival cases and redirect cases.
- `varHash`: literal `default` when only default variant values are used; otherwise the first 6 hex chars of a stable sha256 hash of the sorted `key=value` pairs that differ from defaults.

Examples:

- `scene-add-student-form-default` — node-arrival at `form` with default variants. (For AddStudent, default `auth=guest` actually fails the gate, so this becomes a redirect case — same id.)
- `scene-add-student-form-7c1abf` — node-arrival at `form` with `auth=professor` (or `admin`).
- `scene-add-student-form-success-7c1abf` — outcome `success` from `form` with `auth=professor`.
- `scene-add-student-form-error-7c1abf` — outcome `error` from the same entry.
- `scene-add-student-not-found-default` — direct entry to `notFound` (used as a fallback target).

### 5. Apply the idempotency rule

For each computed case id, check `qa/pending/`, `qa/verified/`, and `qa/archived/`. If a file with that id already exists, **skip it**. Never overwrite human-edited cases. If the case body needs to change because the scene changed, add a follow-up note to the user listing the stale case ids so a human can refresh them.

### 6. Write the case files

Use the template in [references/case-template.md](./references/case-template.md) verbatim. Fill `source_scene`, `node`, `outcome` (when present), `expected_frame`, `expected_state`, `variants`, and the checklist from the enumeration. Always include `source_scene` so a future invocation can identify which scene a case derives from.

### 7. Tell the user

In your final message: number of cases emitted, number skipped (idempotency), and any inconsistencies or stale cases that need human attention.

---

## Enumeration sanity rules

- **A node with a gate must have a fallback.** If `gate` is set without `fallback`, emit zero cases for that node and surface the problem.
- **`outcome.set` mutates the variant assignment in the case's expected post-state.** The case's `variants` front-matter records the **entry** assignment; the post-dispatch values appear in the body checklist.
- **Each node should have exactly one `outcome` marked `default: true`.** Warn (but still emit) if zero or multiple are marked.
- **`outcome.frame` must differ from `node.frame`.** Outcomes are frame transitions. If a scene declares a same-frame outcome, warn and skip — SceneCanvas filters it out at runtime, so the qa case would not match the rendered UI.
- **Dead outcomes don't exist in v3** — there is no `guard`. Every declared outcome is reachable from the node whenever its gate passes.

---

## Hard rules

1. Never execute scene code. Reason about gates and outcomes symbolically by reading their source.
2. Never delete or rewrite cases in `qa/pending/`, `qa/verified/`, or `qa/archived/`. Only create new files.
3. Never touch source code under `components/`, `actions/`, `hooks/`, `.atelier/scenes/`, `.atelier/mocks/`, or `.atelier/variants.ts`. This skill is read-only outside `qa/pending/`.
4. Every emitted case must include `source_scene` in its front-matter.
5. If the scene has a broken reference (unknown frame, missing state, unknown variant axis or value, gate without fallback), emit zero cases for the affected node and surface the problem.
6. The case template is the contract — do not invent new front-matter fields.

---

## Reference files

| Topic | File |
|-------|------|
| qa case template + filled example | [case-template.md](./references/case-template.md) |
