import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildFallbackFrameSource, shouldUseTemplateFallback } from './fallback'
import { generateFrameTextWithGateway } from './gateway'
import {
  buildComponentImportStatement,
  inferPrimaryStateAxis,
  inferPrimitiveProps,
  inferStateHints,
} from './infer'
import { normalizeFrameSource } from './normalize'
import { resolveComponentPath, makeComponentImportPath, resolveOutputPath, toPosix } from './paths'
import { buildPrompt } from './prompt'
import { generateFrameInputSchema, type GenerateFrameInput, type GenerateFrameResult } from './schema'

export async function runGenerateFrame(
  rawInput: GenerateFrameInput,
  options: { rootDir?: string; allowTemplateFallback?: boolean } = {}
): Promise<GenerateFrameResult> {
  const input = generateFrameInputSchema.parse(rawInput)
  const rootDir = path.resolve(options.rootDir ?? process.cwd())
  const componentAbsolutePath = resolveComponentPath(rootDir, input.componentPath)
  const componentSource = await readFile(componentAbsolutePath, 'utf8')
  const componentName =
    input.componentName ??
    path.basename(componentAbsolutePath, path.extname(componentAbsolutePath))
  const componentImportPath = makeComponentImportPath(rootDir, componentAbsolutePath)
  const componentImportStatement = buildComponentImportStatement(
    componentSource,
    componentName,
    componentImportPath
  )
  const primaryStateAxis = inferPrimaryStateAxis(componentSource)
  const requiredPrimitiveProps = inferPrimitiveProps(componentSource).filter((prop) => !prop.optional)
  const effectiveStateHints =
    input.stateHints.length > 0 ? input.stateHints : inferStateHints(componentSource)

  console.log('[generate-frame] analysis', {
    componentPath: input.componentPath,
    componentName,
    mode: input.mode,
    model: input.model,
    stateHintsProvided: input.stateHints,
    inferredStateHints: effectiveStateHints,
    primaryStateAxis: primaryStateAxis?.propName ?? null,
    requiredPrimitiveProps: requiredPrimitiveProps.map((prop) => prop.name),
    componentImportStatement,
  })

  const prompt = buildPrompt({
    componentSource,
    componentName,
    componentImportStatement,
    category: input.category,
    tags: input.tags,
    stateHints: effectiveStateHints,
    variants: input.variants,
  })

  let frameSource: string
  try {
    const generatedText = await generateFrameTextWithGateway(prompt, input.model)
    console.log('[generate-frame] strategy', 'ai')
    frameSource = normalizeFrameSource(generatedText, {
      componentName,
      componentImportStatement,
      category: input.category,
      tags: input.tags,
      variants: input.variants,
    })
  } catch (error) {
    const allowTemplateFallback = options.allowTemplateFallback ?? true
    if (!allowTemplateFallback || !shouldUseTemplateFallback(error)) {
      throw error
    }
    
    frameSource = buildFallbackFrameSource({
      componentName,
      componentImportStatement,
      category: input.category,
      tags: input.tags,
      stateHints: effectiveStateHints,
      variants: input.variants,
      stateAxisProp: primaryStateAxis?.propName,
      requiredPrimitiveProps,
    })
  }

  const outputAbsolutePath = resolveOutputPath(rootDir, componentName, input.outputPath)
  if (input.mode === 'write') {
    await mkdir(path.dirname(outputAbsolutePath), { recursive: true })
    await writeFile(outputAbsolutePath, frameSource, 'utf8')
  }

  return {
    mode: input.mode,
    outputPath: toPosix(path.relative(rootDir, outputAbsolutePath)),
    frameSource,
    componentPath: toPosix(path.relative(rootDir, componentAbsolutePath)),
    componentImportPath,
    model: input.model,
  }
}
