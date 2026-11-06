import path from 'node:path'
import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { scanProject } from './scan'
import { impactReport } from './impact'
import type { ProjectGraph } from './types'
import { readSources, sourceFingerprint } from './source'

export async function readJson<T>(file: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(file, 'utf8')) as T }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error }
}

/** Atomic replace, and no write on no-op (important for watch feedback loops). */
export async function writeJson(file: string, value: unknown): Promise<void> {
  const text = JSON.stringify(value, null, 2) + '\n'
  try { if (await readFile(file, 'utf8') === text) return } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`
  try { await writeFile(temporary, text); await rename(temporary, file) }
  finally { await unlink(temporary).catch(() => {}) }
}

export async function runProjectScan(options: { rootDir?: string; check?: boolean; review?: boolean; reviewModel?: string } = {}) {
  const root = path.resolve(options.rootDir ?? process.cwd())
  const graphPath = path.join(root, '.atelier/generated/graph.json')
  const previous = await readJson<ProjectGraph>(graphPath)
  const graph = scanProject(root)
  const report = impactReport(graph, previous)
  const { coverageFindings } = await import('./coverage')
  report.findings.push(...await coverageFindings(root, graph))
  if (options.review) {
    const { reviewAffectedStates } = await import('./review')
    report.findings.push(...await reviewAffectedStates(root, graph, { write: !options.check, model: options.reviewModel }))
  }
  if (!options.check) {
    if (sourceFingerprint(readSources(root), graph.extractorVersion) !== graph.fingerprint) throw new Error('Source changed during scan. Retry against the current files; no new baseline was written.')
    await writeJson(graphPath, graph)
    await writeJson(path.join(root, '.atelier/generated/report.json'), report)
    await writeJson(path.join(root, '.atelier/generated/features.json'), graph.features.map(feature => ({ ...feature, frames: graph.usages.filter(use => use.feature === feature.slug) })))
  }
  return { graph, report, drift: !previous || previous.fingerprint !== graph.fingerprint }
}
