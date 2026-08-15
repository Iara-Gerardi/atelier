# Portability

How Atelier is meant to fit into any pre-existing project and be usable by any developer, regardless of AI subscription or coding assistant.

## Distribution: npm package (planned)

Atelier will ship as an **npm package**, built later. For the MVP we only record the decision so the code is structured to allow it. What will travel with the package:

- The Vite config and registry runtime (`.atelier/registry/`, the preview shell).
- The AI generators (`ai/tools/`) and the MCP server (`scripts/atelier-mcp/`).
- The skills and agent templates (`.github/skills/`, `.github/agents/`).

What stays project-local (created by an init step): the `.atelier/mocks/` frames, `.atelier/scenes/`, `.atelier/variants.ts`, and `features/`. The example app in this repo (`components/`, `actions/`, `hooks/`) is the **showcase**, not part of the package.

## Axis 1 — Any AI provider

The generators route through the Vercel AI Gateway by default (one key, `provider/model` ids), so OpenAI / Anthropic / Google / etc. all work. A dev picks theirs once:

```bash
npm run atelier:setup   # writes provider + model into .atelier/ai.config.json
```

`.atelier/ai.config.json` declares `provider`, `model`, and `apiKeyEnv`. Per-call `--provider` / `--model` flags on `gen-frame` / `gen-scene` override it. No subscription is assumed.

## Axis 2 — Any host assistant

Different assistants store agent/skill files in different folders. Atelier stays neutral because **all real capabilities live in the MCP server** (`list_stories`, `get_story_info`, `navigate_to_story`, `generate_frame`, `generate_scene`). The agent/skill files are thin instructions over those tools.

| Assistant | Agents | Skills / rules | MCP config |
|-----------|--------|----------------|------------|
| GitHub Copilot | `.github/agents/` | `.github/skills/`, `AGENTS.md` | `.vscode/mcp.json` |
| Claude Code | `.claude/agents/` | `.claude/skills/`, `CLAUDE.md` | `.mcp.json` |
| Cursor | `.cursor/` | `.cursor/rules/` | `.cursor/mcp.json` |

Canonical copies live under `.github/` today so Copilot works now; the identical content drops into the other folders. The future npm scaffolder detects the assistant and copies the files there.
