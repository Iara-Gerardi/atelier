# Current state

Snapshot of what exists today. Update when a pillar materially changes.

## Built and working

- **Core engine** — registry auto-discovery (`.atelier/registry/`), frames, scenes, variants, mocked `Button`, Vite aliases (`vite.atelier.config.ts`), registry API at `/api/registry`.
- **Visualization** — `.atelier/PreviewShell.tsx` with frame / scene / canvas modes, `StateBar`, `VariantBar`, `SceneCanvas`, `ComponentCanvas`, `CanvasGrid`.
- **AI frame generator** — `ai/tools/frame-generator/` + CLI (`npm run gen-frame`) + MCP tool, with deterministic fallback when the LLM is unavailable.
- **MCP server** — `scripts/atelier-mcp/` exposes `list_stories`, `get_story_info`, `navigate_to_story`, `generate_frame`.
- **Skills** — `atelier`, `bugfix`, `feature-analyst`, `scene-coverage` under `.github/skills/`.
- **Agents** — `qa-agent` under `.github/agents/`.
- **QA lifecycle** — `qa/{pending,verified,archived,suites}/`.

## Coverage

- **Frames**: most components have one. Variants: `auth` only.
- **Scenes**: `AddStudent` demo flow.
- **Feature docs**: framework defined in `features/README.md`; individual feature folders authored as part of full showcase coverage.

## Gaps being closed (MVP)

- **Scene generator** — AI pipeline analogous to the frame generator (`ai/tools/scene-generator/`).
- **Provider-agnostic AI layer** — `.atelier/ai.config.json` + `npm run atelier:setup` so any provider/model works (see [portability.md](./portability.md)).
- **Creator agents** — `frame-creator`, `scene-creator`, `feature-builder` (thin wrappers over MCP tools).
- **Showcase coverage** — frames for every component, real scenes for multi-screen flows, 4-file feature docs.
- **Tooling** — `typecheck` script; consolidate frames into `.atelier/mocks/` (was split with `.atelier/frames/`).
