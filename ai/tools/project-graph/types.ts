import type { RenderBranch } from './branches'

export type NodeKind = 'file' | 'symbol' | 'frame' | 'state' | 'scene' | 'variant' | 'feature' | 'branch'
export type EdgeKind = 'contains' | 'imports' | 'type' | 'uses' | 'calls' | 'renders' | 'represents' | 'references' | 'variant' | 'mocks' | 'entry'

export interface GraphNode {
  id: string
  kind: NodeKind
  file: string
  name: string
  line?: number
  hash: string
}

export interface GraphEdge {
  from: string
  to: string
  kind: EdgeKind
  file: string
  line: number
}

export interface EntryPoint { file: string; symbol?: string }
export interface Feature {
  slug: string
  name: string
  goal: string
  entries: EntryPoint[]
  exclude?: EntryPoint[]
  scenes?: string[]
}

export interface FrameInfo {
  id: string
  file: string
  name: string
  states: string[]
  variants: string[]
  components: string[]
}

export interface Finding {
  code: string
  severity: 'error' | 'warning' | 'info'
  file: string
  message: string
}

export interface FeatureUsage {
  feature: string
  frame: string
  /** Directed path from the declared entry to a component represented by the frame. */
  path: string[]
}

export interface ProjectGraph {
  schemaVersion: 1
  extractorVersion: string
  fingerprint: string
  files: Record<string, string>
  nodes: GraphNode[]
  edges: GraphEdge[]
  frames: FrameInfo[]
  features: Feature[]
  usages: FeatureUsage[]
  variants: Record<string, { values: string[]; default: string }>
  findings: Finding[]
  branches: RenderBranch[]
}

export interface ScanReport {
  schemaVersion: 1
  fingerprint: string
  changedFiles: string[]
  affectedNodes: string[]
  recheck: { frames: string[]; scenes: string[]; variants: string[]; mocks: string[]; actions: string[]; features: string[] }
  findings: Finding[]
}
