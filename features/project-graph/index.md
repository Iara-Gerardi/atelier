---
slug: project-graph
name: Project graph and render coverage
goal: Trace feature usage and detect stale Atelier contracts and execution evidence after code changes.
entries:
  - file: scripts/atelier-scan.ts
  - file: scripts/atelier-catalog.ts
  - file: scripts/atelier-coverage.ts
---

Developer tooling for TS/TSX projects. The scanner derives usage labels from declared entries, refreshes generated artifacts, and reports source/preview mismatches. It does not rewrite business logic or infer user navigation from imports. See [the workflow](../../docs/project-graph.md).
