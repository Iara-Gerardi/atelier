import { escapeRegExp, unwrapFence } from '../frame-generator/shared'
import type { FrameCatalogEntry } from './infer'

const TYPE_IMPORT_LINE =
  "import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'"
const META_EXPORT_PATTERN = /export const meta\s*(?::\s*SceneMeta)?\s*=\s*\{/

interface NormalizeSceneParams {
  sceneName: string
  category: string
  tags: string[]
  catalog: FrameCatalogEntry[]
}

/**
 * Normalize a generated scene file: enforce the type import, typed meta export,
 * typed `scene` declaration, and the default export. Then validate that every
 * referenced frame exists in the catalog (catches hallucinated frame names).
 */
export function normalizeSceneSource(generatedText: string, params: NormalizeSceneParams): string {
  let source = unwrapFence(generatedText)

  if (!source.includes(TYPE_IMPORT_LINE)) {
    source = `${TYPE_IMPORT_LINE}\n${source}`
  }

  const metaTyped = `export const meta: SceneMeta = {`
  if (META_EXPORT_PATTERN.test(source)) {
    source = source.replace(META_EXPORT_PATTERN, metaTyped)
  } else {
    const tagsLiteral = `,\n  tags: ${JSON.stringify(params.tags)}`
    source = `${source}\n\n${metaTyped}\n  name: '${params.sceneName}',\n  category: '${params.category}'${tagsLiteral},\n}\n`
  }

  const metaCount = (source.match(/\bexport const meta\b/g) ?? []).length
  if (metaCount !== 1) {
    throw new Error('Generated scene must contain exactly one meta export.')
  }

  const sceneTyped = `const scene: SceneDef = {`
  const sceneDeclRegex = /(^|\n)\s*(?:export\s+)?(?:const|let|var)\s+scene\s*(?::\s*[^=]+)?\s*=\s*\{/
  if (sceneDeclRegex.test(source)) {
    source = source.replace(sceneDeclRegex, `$1${sceneTyped}`)
  } else {
    const exportedMatch = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\b/)
    const exportedId = exportedMatch?.[1]
    if (exportedId && exportedId !== 'scene') {
      const declRegex = new RegExp(
        `(^|\\n)\\s*(?:export\\s+)?(?:const|let|var)\\s+${escapeRegExp(exportedId)}\\s*(?::\\s*[^=]+)?\\s*=\\s*\\{`
      )
      if (declRegex.test(source)) {
        source = source.replace(declRegex, `$1${sceneTyped}`)
        source = source.replace(
          new RegExp(`export\\s+default\\s+${escapeRegExp(exportedId)}\\b`),
          'export default scene'
        )
      } else {
        throw new Error('Generated scene is missing a normalizable scene object declaration.')
      }
    } else {
      throw new Error('Generated scene is missing a normalizable scene object declaration.')
    }
  }

  if (!/export default scene\b/.test(source)) {
    source = `${source.trimEnd()}\n\nexport default scene\n`
  }

  assertKnownFrames(source, params.catalog)

  return source.trimEnd() + '\n'
}

/** Throw if any `frame: '...'` reference is not a known frame name. */
function assertKnownFrames(source: string, catalog: FrameCatalogEntry[]): void {
  const known = new Set(catalog.map((entry) => entry.name))
  const referenced = new Set<string>()
  for (const match of source.matchAll(/\bframe:\s*['"]([^'"]+)['"]/g)) {
    referenced.add(match[1])
  }
  const unknown = [...referenced].filter((name) => !known.has(name))
  if (unknown.length > 0) {
    throw new Error(
      `Generated scene references unknown frames: ${unknown.join(', ')}. Known frames: ${[...known].join(', ')}.`
    )
  }
}
