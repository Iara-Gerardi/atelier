import type { ProjectGraph, ScanReport } from './types'
import { hash } from './source'
import { walkGraph } from './scan'

const isConfig = (file: string) => /(?:^|\/)tsconfig[^/]*\.json$/.test(file) || /^(?:atelier\.config\.[jt]s|vite\.atelier\.config\.[jt]s|package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file)

/** Dependencies are deliberately broader than feature membership, including types and mocks. */
export function dependencyFingerprint(graph: ProjectGraph, start: string): string {
  const roots = [start]
  if (start.startsWith('frame:')) {
    // Evidence depends on the renderer and instrumenter as well as the fixture.
    for (const file of ['.atelier/main.tsx', 'vite.atelier.config.ts', 'ai/tools/project-graph/branches.ts', 'ai/tools/project-graph/capture.ts', 'ai/tools/project-graph/coverage-plugin.ts']) {
      if (graph.files[file]) roots.push(`file:${file}`)
    }
  }
  const visited = walkGraph(graph, roots)
  const fileNames = new Set(graph.nodes.filter(n => visited.has(n.id)).map(n => n.file))
  for (const file of Object.keys(graph.files)) if (isConfig(file)) fileNames.add(file)
  return hash(JSON.stringify({ version: graph.extractorVersion, files: [...fileNames].sort().map(file => [file, graph.files[file]]) }))
}

export function impactReport(graph: ProjectGraph, previous?: ProjectGraph): ScanReport {
  const files = new Set([...Object.keys(graph.files), ...Object.keys(previous?.files ?? {})])
  const changedFiles = [...files].filter(file => graph.files[file] !== previous?.files[file]).sort()
  const changed = new Set(changedFiles)
  const mergedNodes = [...(previous?.nodes ?? []), ...graph.nodes]
  const seeds = mergedNodes.filter(node => changed.has(node.file)).map(node => node.id)
  const graphChanged = previous && previous.extractorVersion !== graph.extractorVersion
  const configChanged = changedFiles.some(isConfig)
  const affected = graphChanged || configChanged
    ? new Set(mergedNodes.map(n => n.id))
    : new Set(walkGraph({ edges: [...(previous?.edges ?? []), ...graph.edges] }, seeds, { reverse: true }).keys())
  const select = (kind: string) => [...new Set(mergedNodes.filter(node => node.kind === kind && affected.has(node.id)).map(node => node.file))].sort()
  const affectedFiles = new Set(mergedNodes.filter(n => affected.has(n.id)).map(n => n.file))
  return {
    schemaVersion: 1, fingerprint: graph.fingerprint, changedFiles, affectedNodes: [...affected].sort(),
    recheck: {
      frames: select('frame'), scenes: select('scene'), variants: select('variant'), features: select('feature'),
      mocks: [...affectedFiles].filter(file => file.startsWith('.atelier/mocks/') && !file.endsWith('.frame.tsx')).sort(),
      actions: [...affectedFiles].filter(file => /^(?:src\/)?actions\//.test(file)).sort(),
    },
    findings: [...graph.findings],
  }
}
