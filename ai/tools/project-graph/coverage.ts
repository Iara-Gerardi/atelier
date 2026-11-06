import path from 'node:path'
import { readdir } from 'node:fs/promises'
import { z } from 'zod'
import type { Finding, ProjectGraph } from './types'
import { dependencyFingerprint } from './impact'
import { walkGraph } from './scan'
import { readJson } from './run'

export const coverageStepSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('click'), selector: z.string().min(1) }),
  z.object({ action: z.literal('fill'), selector: z.string().min(1), value: z.string() }),
  z.object({ action: z.literal('wait'), ms: z.number().int().min(0).max(10000) }),
  z.object({ action: z.literal('assert-visible'), selector: z.string().min(1) }),
  z.object({ action: z.literal('assert-text'), selector: z.string().min(1), text: z.string() }),
])
export const coveragePlanSchema = z.object({
  frame: z.string().min(1), state: z.string().min(1),
  variants: z.record(z.string(), z.string()).default({}),
  settleMs: z.number().int().min(0).max(10000).default(150),
  steps: z.array(coverageStepSchema).default([]),
})
export type CoveragePlan = z.infer<typeof coveragePlanSchema>
export type BranchHits = Record<string, Record<string, number>>
export interface CoverageReceipt {
  schemaVersion: 2
  id: string
  frame: string
  frameId: string
  state: string
  variants: Record<string, string>
  fingerprint: string
  servedFingerprint: string
  loadedSources: Record<string, string>
  capturedAt: string
  plan: CoveragePlan
  status: 'executed' | 'asserted' | 'failed'
  assertions: number
  errors: string[]
  hits: BranchHits
  checkpoints: { step: string; hits: BranchHits }[]
}

export async function readCoverage(root: string): Promise<CoverageReceipt[]> {
  const directory = path.join(root, '.atelier/coverage')
  let files: string[]
  try { files = await readdir(directory) } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error }
  const receipts: CoverageReceipt[] = []
  for (const file of files.sort().filter(f => f.endsWith('.json'))) {
    const receipt = await readJson<CoverageReceipt>(path.join(directory, file))
    if (receipt?.schemaVersion === 2 && receipt.frameId && receipt.hits && receipt.loadedSources && receipt.servedFingerprint) receipts.push(receipt)
  }
  return receipts
}

export async function coverageFindings(root: string, graph: ProjectGraph): Promise<Finding[]> {
  const receipts = await readCoverage(root)
  const findings: Finding[] = []
  for (const frame of graph.frames) {
    const fingerprint = dependencyFingerprint(graph, frame.id)
    const executions = receipts.filter(run => run.frameId === frame.id)
    const current = executions.filter(run => run.fingerprint === fingerprint)
    const successful = current.filter(run => run.status !== 'failed')
    if (executions.some(run => run.fingerprint !== fingerprint)) findings.push({ code: 'stale-frame-coverage', file: frame.file, severity: 'warning', message: `${frame.name}: dependency changes invalidated stored executions. Run atelier:coverage again.` })
    if (current.some(run => run.status === 'failed')) findings.push({ code: 'failed-frame-execution', file: frame.file, severity: 'error', message: `${frame.name}: ${current.filter(run => run.status === 'failed').length} execution(s) failed.` })
    const missing = frame.states.filter(state => !successful.some(run => run.state === state))
    if (missing.length) findings.push({ code: 'unexecuted-states', file: frame.file, severity: 'info', message: `${frame.name}: no current execution for ${missing.join(', ')}. This does not prove unreachability.` })
    const unasserted = successful.filter(run => run.status !== 'asserted')
    if (unasserted.length) findings.push({ code: 'unasserted-renders', file: frame.file, severity: 'info', message: `${frame.name}: ${unasserted.length} execution(s) have branch evidence but no user-visible assertion.` })
    const relevant = walkGraph(graph, [frame.id])
    const files = new Set(graph.nodes.filter(node => relevant.has(node.id)).map(node => node.file))
    const branches = graph.branches.filter(branch => files.has(branch.file))
    const missingOutcomes = branches.flatMap(branch => branch.outcomes.filter(outcome => !successful.some(run => (run.hits[branch.id]?.[outcome] ?? 0) > 0)).map(outcome => `${branch.file}:${branch.line} ${branch.expression} → ${outcome}`))
    if (missingOutcomes.length) findings.push({ code: 'unobserved-render-branches', file: frame.file, severity: 'info', message: `${frame.name}: ${missingOutcomes.length} branch outcome(s) not observed: ${missingOutcomes.join('; ')}. Branch coverage is not exhaustive visual-state coverage.` })
    for (const axis of frame.variants) {
      const missingValues = (graph.variants[axis]?.values ?? []).filter(value => !successful.some(run => run.variants[axis] === value))
      if (missingValues.length) findings.push({ code: 'unexecuted-variant-values', file: frame.file, severity: 'info', message: `${frame.name}: ${axis} values not executed: ${missingValues.join(', ')}. Value coverage does not imply combination coverage.` })
    }
  }
  return findings
}

/** Bounded enumeration reports omissions; never silently treats a sample as exhaustive. */
export function defaultCoveragePlans(graph: ProjectGraph, frameName?: string, stateName?: string, maxCombinations = 8): { plans: CoveragePlan[]; omissions: string[] } {
  const frames = frameName ? graph.frames.filter(frame => frame.name === frameName) : graph.frames
  if (frameName && !frames.length) throw new Error(`Unknown frame ${frameName}`)
  if (stateName && !frameName) throw new Error('--state requires --frame')
  const plans: CoveragePlan[] = []
  const omissions: string[] = []
  for (const frame of frames) {
    if (stateName && !frame.states.includes(stateName)) throw new Error(`Unknown state ${frame.name}/${stateName}`)
    let combos: Record<string, string>[] = [{}]
    let total = 1
    for (const axis of frame.variants) {
      const definition = graph.variants[axis]
      if (!definition) throw new Error(`Unknown variant ${axis}`)
      const values = [definition.default, ...definition.values.filter(value => value !== definition.default)]
      total *= values.length
      combos = combos.flatMap(combo => values.map(value => ({ ...combo, [axis]: value }))).slice(0, maxCombinations)
    }
    if (total > combos.length) omissions.push(`${frame.name}: executed ${combos.length}/${total} variant assignments per state`)
    for (const state of stateName ? [stateName] : frame.states) for (const variants of combos) plans.push({ frame: frame.name, state, variants, settleMs: 150, steps: [] })
  }
  return { plans, omissions }
}
