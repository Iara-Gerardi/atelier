import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { generateAtelierText, resolveDefaultModel } from '../provider'
import { buildFrameCatalog, readVariantRegistry, type FrameCatalogEntry } from './infer'
import { buildScenePrompt } from './prompt'
import { normalizeSceneSource } from './normalize'
import { buildFallbackSceneSource, shouldUseTemplateFallback } from './fallback'
import { resolveSceneOutputPath, toPosix } from './paths'
import {
  generateSceneInputSchema,
  type GenerateSceneInput,
  type GenerateSceneResult,
} from './schema'

function assertEntryFrame(catalog: FrameCatalogEntry[], entryFrame: string, entryState: string): void {
  const frame = catalog.find((entry) => entry.name === entryFrame)
  if (!frame) {
    throw new Error(
      `entryFrame "${entryFrame}" is not a registered frame. Known frames: ${catalog
        .map((entry) => entry.name)
        .join(', ')}.`
    )
  }
  if (entryState && !frame.states.includes(entryState)) {
    throw new Error(
      `entryState "${entryState}" is not a state of "${entryFrame}". States: ${frame.states.join(', ')}.`
    )
  }
}

export async function runGenerateScene(
  rawInput: GenerateSceneInput,
  options: { rootDir?: string; calledFrom?: 'cli' | 'mcp' | 'tool' | 'unknown' } = {}
): Promise<GenerateSceneResult> {
  const input = generateSceneInputSchema.parse(rawInput)
  const rootDir = path.resolve(options.rootDir ?? process.cwd())
  const calledFrom = options.calledFrom ?? 'unknown'
  const model = input.model ?? resolveDefaultModel(rootDir)

  const catalog = await buildFrameCatalog(rootDir)
  if (catalog.length === 0) {
    throw new Error('No frames found under .atelier/mocks/. Create frames before generating a scene.')
  }
  assertEntryFrame(catalog, input.entryFrame, input.entryState)
  const variants = await readVariantRegistry(rootDir)

  console.log(`[generate-scene] called from: ${calledFrom}`)
  console.log('[generate-scene] analysis', {
    name: input.name,
    mode: input.mode,
    model,
    entryFrame: input.entryFrame,
    entryState: input.entryState || '(first state)',
    framesAllowed: input.frames.length > 0 ? input.frames : '(any)',
    catalogSize: catalog.length,
  })

  const allowedCatalog =
    input.frames.length > 0 ? catalog.filter((entry) => input.frames.includes(entry.name)) : catalog

  const prompt = buildScenePrompt({
    name: input.name,
    description: input.description,
    category: input.category,
    tags: input.tags,
    entryFrame: input.entryFrame,
    entryState: input.entryState,
    catalog: allowedCatalog,
    variants,
  })

  let sceneSource: string
  try {
    const generatedText = await generateAtelierText({ prompt, model, rootDir })
    console.log('[generate-scene] strategy', 'ai')
    sceneSource = normalizeSceneSource(generatedText, {
      sceneName: input.name,
      category: input.category,
      tags: input.tags,
      catalog: allowedCatalog,
    })
  } catch (error) {
    if (!shouldUseTemplateFallback(error)) throw error
    console.log('[generate-scene] strategy', 'fallback')
    sceneSource = buildFallbackSceneSource({
      sceneName: input.name,
      category: input.category,
      tags: input.tags,
      entryFrame: input.entryFrame,
      entryState: input.entryState,
      frames: input.frames,
      catalog: allowedCatalog,
    })
  }

  const outputAbsolutePath = resolveSceneOutputPath(rootDir, input.name, input.outputPath)
  if (input.mode === 'write') {
    await mkdir(path.dirname(outputAbsolutePath), { recursive: true })
    await writeFile(outputAbsolutePath, sceneSource, 'utf8')
  }

  return {
    mode: input.mode,
    outputPath: toPosix(path.relative(rootDir, outputAbsolutePath)),
    sceneSource,
    sceneName: input.name,
    model,
  }
}
