import { escapeRegExp, makeVariantGeneric, unwrapFence } from './shared'

interface NormalizeFrameParams {
  componentName: string
  componentImportStatement: string
  category: string
  tags: string[]
  variants: string[]
}

export function normalizeFrameSource(
  generatedText: string,
  params: NormalizeFrameParams
): string {
  const variantGeneric = makeVariantGeneric(params.variants)
  const componentImportLine = params.componentImportStatement
  const typeImportLine = "import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'"

  let source = unwrapFence(generatedText)

  const componentImportRegex = new RegExp(
    `^\\s*import\\s+[^\\n;]*\\b${escapeRegExp(params.componentName)}\\b[^\\n;]*from\\s+['"][^'"]+['"]\\s*;?\\s*$`,
    'm'
  )
  if (componentImportRegex.test(source)) {
    source = source.replace(componentImportRegex, componentImportLine)
  } else {
    source = `${componentImportLine}\n${source}`
  }

  if (!source.includes(typeImportLine)) {
    source = `${typeImportLine}\n${source}`
  }

  const metaTyped = `export const meta: MockMeta${variantGeneric} = {`
  if (/export const meta\s*=/.test(source)) {
    source = source.replace(
      /export const meta\s*(?::\s*MockMeta(?:<[^>]+>)?)?\s*=\s*\{/,
      metaTyped
    )
  } else {
    const tagsLiteral = params.tags.length > 0 ? `,\n  tags: ${JSON.stringify(params.tags)}` : ''
    const variantsLiteral =
      params.variants.length > 0
        ? `,\n  variants: ${JSON.stringify(params.variants)} as const`
        : ''
    source = `${source}\n\n${metaTyped}\n  name: '${params.componentName}',\n  category: '${params.category}'${tagsLiteral}${variantsLiteral},\n}\n`
  }

  const statesTyped = `const states: Record<StateKey, ComponentState${variantGeneric}> = {`
  if (/const states\s*=/.test(source)) {
    source = source.replace(
      /const states\s*(?::\s*Record<StateKey,\s*ComponentState(?:<[^>]+>)?>)?\s*=\s*\{/,
      statesTyped
    )
  } else {
    throw new Error('Generated frame is missing `const states = { ... }`.')
  }

  if (!/export default states\b/.test(source)) {
    source = `${source.trimEnd()}\n\nexport default states\n`
  }

  if (!/description:\s*['"`]/.test(source)) {
    throw new Error('Generated frame must include at least one state description.')
  }

  return source.trimEnd() + '\n'
}
