import path from 'node:path'
import { loadEnvConfig } from '@next/env'
import { z } from 'zod'
import { extractStateCandidates } from '../state-manifest/extract'
import { reviewStateCandidatesWithJev, DEFAULT_JEV_MODEL } from '../state-manifest/review'
import { dependencyFingerprint } from './impact'
import { fileId, hash, readText } from './source'
import { readJson, writeJson } from './run'
import type { Finding, ProjectGraph } from './types'

export async function reviewJevQuestions(root: string, state: unknown, questions: Record<string, { type: 'noul'; instructions: string }>, model = DEFAULT_JEV_MODEL): Promise<Record<string, number>> {
  if (!Object.keys(questions).length) return {}
  loadEnvConfig(root)
  const apiKey = process.env.TYPESAFE_API_KEY ?? process.env.JEV_API
  if (!apiKey) throw new Error('Jev review requires TYPESAFE_API_KEY or JEV_API in the project environment.')
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', signal: AbortSignal.timeout(60000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, state, questions }),
  })
  if (!response.ok) throw new Error(`Jev review failed (${response.status}). No catalog or review cache was written.`)
  const parsed = z.object({ answers: z.record(z.string(), z.object({ noul: z.number().finite().min(0).max(1) })) }).parse(await response.json())
  return Object.fromEntries(Object.keys(questions).map(key => {
    if (!parsed.answers[key]) throw new Error(`Jev omitted answer ${key}`)
    return [key, parsed.answers[key].noul]
  }))
}

export async function reviewAffectedStates(root: string, graph: ProjectGraph, options: { write: boolean; model?: string }): Promise<Finding[]> {
  const model = options.model ?? DEFAULT_JEV_MODEL
  const findings: Finding[] = []
  const sources = [...new Set(graph.frames.flatMap(frame => frame.components).map(id => graph.nodes.find(node => node.id === id)?.file).filter((file): file is string => Boolean(file)))].sort()
  for (const file of sources) {
    const source = readText(root, file)
    const candidates = extractStateCandidates(source, file)
    const fingerprint = hash(JSON.stringify({ dependency: dependencyFingerprint(graph, fileId(file)), candidates, model, questionVersion: 1 }))
    const cachePath = path.join(root, '.atelier/generated/reviews', `${hash(file).slice(0, 24)}.json`)
    let cache = await readJson<{ fingerprint: string; reviews: { id: string; probability: number }[] }>(cachePath)
    if (cache?.fingerprint !== fingerprint) {
      const reviews = await reviewStateCandidatesWithJev({ componentSource: source, componentName: path.basename(file), candidates, rootDir: root, model })
      cache = { fingerprint, reviews }
      // The review is a hypothesis, never a mutation of frame states or business logic.
      if (options.write) await writeJson(cachePath, cache)
    }
    findings.push({ code: 'state-review', file, severity: 'info', message: `Jev reviewed ${cache.reviews.length} static candidates; ${cache.reviews.filter(review => review.probability >= 0.7).length} scored ≥0.7. Review cache: ${path.relative(root, cachePath)}. Names do not imply coverage; verify with frame execution.` })
  }
  return findings
}
