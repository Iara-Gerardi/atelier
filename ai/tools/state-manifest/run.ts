import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { stringify } from 'yaml'
import { resolveComponentPath, toPosix } from '../frame-generator/paths'
import { extractStateCandidates } from './extract'
import { reviewStateCandidatesWithJev } from './review'
import {
  generateStateManifestInputSchema,
  type ComponentStateManifest,
  type GenerateStateManifestInput,
  type GenerateStateManifestResult,
} from './schema'

function ensureInside(parentDir: string, candidatePath: string): void {
  const relative = path.relative(parentDir, candidatePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`outputPath must stay inside ${toPosix(parentDir)}`)
  }
}

function resolveManifestOutputPath(
  rootDir: string,
  componentName: string,
  outputPath?: string
): string {
  const statesRoot = path.resolve(rootDir, '.atelier', 'states')
  const resolved = outputPath
    ? path.resolve(rootDir, outputPath)
    : path.resolve(statesRoot, `${componentName}.states.yaml`)
  ensureInside(statesRoot, resolved)
  if (!['.yaml', '.yml'].includes(path.extname(resolved).toLowerCase())) {
    throw new Error('outputPath must be a .yaml or .yml file.')
  }
  return resolved
}

function inferComponentName(componentAbsolutePath: string): string {
  const baseName = path.basename(componentAbsolutePath, path.extname(componentAbsolutePath))
  return baseName === 'index' ? path.basename(path.dirname(componentAbsolutePath)) : baseName
}

export async function runGenerateStateManifest(
  rawInput: GenerateStateManifestInput,
  options: { rootDir?: string; calledFrom?: 'cli' | 'mcp' | 'tool' | 'unknown' } = {}
): Promise<GenerateStateManifestResult> {
  const input = generateStateManifestInputSchema.parse(rawInput)
  const rootDir = path.resolve(options.rootDir ?? process.cwd())
  const showProgress = options.calledFrom === 'cli'
  const report = (message: string): void => {
    if (showProgress) console.error(`[generate-states] ${message}`)
  }

  const componentAbsolutePath = resolveComponentPath(rootDir, input.componentPath)
  report(`1/4 Reading ${toPosix(path.relative(rootDir, componentAbsolutePath))}`)
  const componentSource = await readFile(componentAbsolutePath, 'utf8')
  const componentPath = toPosix(path.relative(rootDir, componentAbsolutePath))
  const componentName = input.componentName ?? inferComponentName(componentAbsolutePath)
  const candidates = extractStateCandidates(componentSource, componentPath)
  report(`2/4 AST extraction found ${candidates.length} candidate state(s):`)
  for (const candidate of candidates) {
    const evidence = candidate.evidence
      .map((item) => `${item.kind}:L${item.line}`)
      .join(', ')
    report(`    - ${candidate.id} (${candidate.axis}=${String(candidate.value)}) [${evidence}]`)
  }

  report(
    input.review
      ? `3/4 Asking ${input.model} to validate ${candidates.length} candidate(s) in one request`
      : '3/4 Jev validation skipped (--no-review)'
  )
  const reviews = input.review
    ? await reviewStateCandidatesWithJev({
        componentSource,
        componentName,
        candidates,
        model: input.model,
        rootDir,
      })
    : []
  const probabilities = new Map(
    reviews.map((review) => [review.id, Math.round(review.probability * 10_000) / 10_000])
  )
  const states = candidates.map((candidate) => {
    const probability = probabilities.get(candidate.id) ?? null
    return {
      ...candidate,
      validityProbability: probability,
      valid: probability === null ? null : probability >= input.threshold,
    }
  })
  const validCount = input.review ? states.filter((state) => state.valid).length : null

  const manifest: ComponentStateManifest = {
    schemaVersion: 1,
    component: {
      name: componentName,
      source: componentPath,
    },
    validation: {
      enabled: input.review,
      model: input.review ? input.model : null,
      threshold: input.threshold,
    },
    states,
    summary: {
      candidates: states.length,
      valid: validCount,
      rejected: validCount === null ? null : states.length - validCount,
    },
  }
  const yaml = stringify(manifest, { lineWidth: 0 })
  const outputAbsolutePath = resolveManifestOutputPath(rootDir, componentName, input.outputPath)

  if (input.review) {
    report(`    Validation threshold: ${Math.round(input.threshold * 100)}%`)
    for (const state of states) {
      const probability = Math.round((state.validityProbability ?? 0) * 100)
      report(`    - ${state.valid ? 'PASS' : 'REJECT'} ${state.id}: ${probability}%`)
    }
  }

  if (input.mode === 'write') {
    report(`4/4 Writing ${toPosix(path.relative(rootDir, outputAbsolutePath))}`)
    await mkdir(path.dirname(outputAbsolutePath), { recursive: true })
    await writeFile(outputAbsolutePath, yaml, 'utf8')
  } else {
    report('4/4 Preview ready; YAML follows on stdout')
  }

  return {
    mode: input.mode,
    outputPath: toPosix(path.relative(rootDir, outputAbsolutePath)),
    componentPath,
    manifest,
    yaml,
  }
}
