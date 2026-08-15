import type { FrameCatalogEntry } from './infer'

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function firstState(catalog: FrameCatalogEntry[], frameName: string, preferred?: string): string {
  const frame = catalog.find((entry) => entry.name === frameName)
  if (preferred && frame?.states.includes(preferred)) return preferred
  return frame?.states[0] ?? 'default'
}

function nodeIdFor(frameName: string): string {
  const id = frameName.charAt(0).toLowerCase() + frameName.slice(1)
  return id.replace(/[^A-Za-z0-9_$]/g, '')
}

/** Reuse the frame generator's fallback trigger so output stays deterministic. */
export { shouldUseTemplateFallback } from '../frame-generator/fallback'

/**
 * Deterministically build a valid minimal scene without calling an LLM. Wires the
 * entry frame to the first available second frame via a single default outcome.
 */
export function buildFallbackSceneSource(input: {
  sceneName: string
  category: string
  tags: string[]
  entryFrame: string
  entryState: string
  frames: string[]
  catalog: FrameCatalogEntry[]
}): string {
  const { sceneName, category, tags, entryFrame, entryState, frames, catalog } = input

  const startState = firstState(catalog, entryFrame, entryState || undefined)
  const allowed = frames.length > 0 ? frames : catalog.map((entry) => entry.name)
  const targetFrame = allowed.find((name) => name !== entryFrame && catalog.some((e) => e.name === name))

  const metaBlock = [
    `export const meta: SceneMeta = {`,
    `  name: ${quote(sceneName)},`,
    `  category: ${quote(category)},`,
    `  tags: [${tags.map(quote).join(', ')}],`,
    `}`,
  ].join('\n')

  const startNodeId = 'start'
  let nodesBlock: string

  if (targetFrame) {
    const targetState = firstState(catalog, targetFrame)
    const targetId = nodeIdFor(targetFrame)
    nodesBlock = [
      `    ${startNodeId}: {`,
      `      frame: ${quote(entryFrame)},`,
      `      state: ${quote(startState)},`,
      `      outcomes: [`,
      `        {`,
      `          id: 'continue',`,
      `          frame: ${quote(targetFrame)},`,
      `          state: ${quote(targetState)},`,
      `          trigger: 'Click the primary action button',`,
      `          description: ${quote(`Proceeds from ${entryFrame} to ${targetFrame}.`)},`,
      `          default: true,`,
      `        },`,
      `      ],`,
      `    },`,
      `    ${targetId}: {`,
      `      frame: ${quote(targetFrame)},`,
      `      state: ${quote(targetState)},`,
      `    },`,
    ].join('\n')
  } else {
    nodesBlock = [
      `    ${startNodeId}: {`,
      `      frame: ${quote(entryFrame)},`,
      `      state: ${quote(startState)},`,
      `    },`,
    ].join('\n')
  }

  return `import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'

${metaBlock}

const scene: SceneDef = {
  initial: ${quote(startNodeId)},
  nodes: {
${nodesBlock}
  },
}

export default scene
`
}
