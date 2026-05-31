import { escapeRegExp, makeVariantGeneric, unwrapFence } from './shared'

interface NormalizeFrameParams {
  componentName: string
  componentImportStatement: string
  category: string
  tags: string[]
  variants: string[]
}

const META_EXPORT_PATTERN = /export const meta\s*(?::\s*MockMeta(?:<[^>]+>)?)?\s*=\s*\{/
const META_EXPORT_GLOBAL_PATTERN = /export const meta\s*(?::\s*MockMeta(?:<[^>]+>)?)?\s*=\s*\{/g

function findObjectEndIndex(source: string, openingBraceIndex: number): number {
  let depth = 0

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index]

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
      continue
    }

    if (char === "'" || char === '"' || char === '`') {
      const quote = char
      index += 1
      while (index < source.length) {
        const current = source[index]
        if (current === '\\') {
          index += 2
          continue
        }
        if (current === quote) break
        index += 1
      }
    }
  }

  throw new Error('Generated frame has an unterminated meta object declaration.')
}

function removeDuplicateMetaExports(source: string): string {
  const matches = [...source.matchAll(META_EXPORT_GLOBAL_PATTERN)]
  if (matches.length <= 1) return source

  let nextSource = source

  for (let index = matches.length - 1; index >= 1; index -= 1) {
    const match = matches[index]
    const start = match.index
    if (start == null) continue

    const openingBraceIndex = start + match[0].length - 1
    const end = findObjectEndIndex(nextSource, openingBraceIndex)
    nextSource = `${nextSource.slice(0, start)}${nextSource.slice(end + 1)}`
  }

  return nextSource
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
  if (META_EXPORT_PATTERN.test(source)) {
    source = source.replace(META_EXPORT_PATTERN, metaTyped)
    source = removeDuplicateMetaExports(source)
  } else {
    const tagsLiteral = params.tags.length > 0 ? `,\n  tags: ${JSON.stringify(params.tags)}` : ''
    const variantsLiteral =
      params.variants.length > 0
        ? `,\n  variants: ${JSON.stringify(params.variants)} as const`
        : ''
    source = `${source}\n\n${metaTyped}\n  name: '${params.componentName}',\n  category: '${params.category}'${tagsLiteral}${variantsLiteral},\n}\n`
  }

  const metaCount = (source.match(/\bexport const meta\b/g) ?? []).length
  if (metaCount !== 1) {
    throw new Error('Generated frame must contain exactly one meta export.')
  }

  const statesTyped = `const states: Record<StateKey, ComponentState${variantGeneric}> = {`
  const statesDeclarationRegex =
    /(^|\n)\s*(?:export\s+)?(?:const|let|var)\s+states\s*(?::\s*[^=]+)?\s*=\s*\{/

  if (statesDeclarationRegex.test(source)) {
    source = source.replace(statesDeclarationRegex, `$1${statesTyped}`)
  } else {
    const exportedIdentifierMatch = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\b/)
    const exportedIdentifier = exportedIdentifierMatch?.[1]

    if (exportedIdentifier && exportedIdentifier !== 'states') {
      const declarationRegex = new RegExp(
        `(^|\\n)\\s*(?:export\\s+)?(?:const|let|var)\\s+${escapeRegExp(exportedIdentifier)}\\s*(?::\\s*[^=]+)?\\s*=\\s*\\{`
      )

      if (declarationRegex.test(source)) {
        source = source.replace(declarationRegex, `$1${statesTyped}`)
      } else {
        throw new Error('Generated frame is missing a normalizable states object declaration.')
      }
    } else if (/export\s+default\s+\{/.test(source)) {
      source = source.replace(/export\s+default\s+\{/, statesTyped)
    } else {
      throw new Error('Generated frame is missing a normalizable states object declaration.')
    }
  }

  if (!/export default states\b/.test(source)) {
    source = `${source.trimEnd()}\n\nexport default states\n`
  }

  if (!/description:\s*['"`]/.test(source)) {
    throw new Error('Generated frame must include at least one state description.')
  }

  return source.trimEnd() + '\n'
}
