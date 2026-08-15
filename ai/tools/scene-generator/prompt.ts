import type { FrameCatalogEntry, VariantRegistry } from './infer'

interface BuildScenePromptInput {
  name: string
  description: string
  category: string
  tags: string[]
  entryFrame: string
  entryState: string
  catalog: FrameCatalogEntry[]
  variants: VariantRegistry
}

function describeCatalog(catalog: FrameCatalogEntry[]): string {
  return catalog
    .map((frame) => {
      const variants = frame.variants.length > 0 ? ` | variants: ${frame.variants.join(', ')}` : ''
      return `- ${frame.name} | states: ${frame.states.join(', ') || '(none)'}${variants}`
    })
    .join('\n')
}

export function buildScenePrompt(input: BuildScenePromptInput): string {
  const variantBlock =
    input.variants.axes.length > 0
      ? [
          'Available variant axes for gates (use only these axis names and their declared values):',
          `Axes: ${input.variants.axes.join(', ')}`,
          'Variant registry source:',
          input.variants.source.trim(),
        ].join('\n')
      : 'No variant axes are declared; do not use gates.'

  return [
    'Generate a single Atelier scene file in TypeScript/TSX.',
    'Output only code. No markdown fences. No explanations.',
    '',
    'A scene wires existing frames into a user flow. Each node points at one frame + state.',
    'Outcomes are FRAME TRANSITIONS: an outcome.frame MUST differ from its node.frame.',
    'Intra-frame state changes are handled by the StateBar, never as outcomes.',
    '',
    'Hard requirements:',
    "- Import types exactly as: import type { SceneDef, SceneMeta } from '@/.atelier/registry/types'",
    `- Export typed meta: export const meta: SceneMeta = { name: '${input.name}', category: '${input.category}', tags: ${JSON.stringify(input.tags)} }`,
    '- Declare typed scene: const scene: SceneDef = { initial, nodes }',
    `- scene.initial must be a key in scene.nodes and the initial node must use frame '${input.entryFrame}'${input.entryState ? ` and state '${input.entryState}'` : ''}.`,
    '- Every node.frame and every outcome.frame must be a frame from the catalog below.',
    '- Every node.state / outcome.state must be a declared state of that frame.',
    '- Every outcome needs: id, frame (different from its node.frame), state, trigger, description.',
    '- Exactly one outcome per node that has outcomes is marked default: true.',
    '- If a node is gated, set gate: ({ variants }) => <boolean>, a fallback node id, and a gateTrigger string.',
    '- End with: export default scene',
    '',
    'Frame catalog (only source of truth for frame + state names):',
    describeCatalog(input.catalog),
    '',
    variantBlock,
    '',
    `Scene name: ${input.name}`,
    `Flow description: ${input.description || '(none provided — infer a sensible linear flow from the entry frame)'}`,
  ].join('\n')
}
