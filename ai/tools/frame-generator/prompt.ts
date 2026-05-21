import { makeVariantGeneric } from './shared'

interface BuildPromptInput {
  componentSource: string
  componentName: string
  componentImportStatement: string
  category: string
  tags: string[]
  stateHints: string[]
  variants: string[]
}

export function buildPrompt(input: BuildPromptInput): string {
  const variantMetaLine =
    input.variants.length > 0
      ? `- Include \`variants: ${JSON.stringify(input.variants)} as const\` in meta and type both meta/states with those variant keys.`
      : '- Do not include meta.variants unless variants are provided.'

  const statesLine =
    input.stateHints.length > 0
      ? `- Include exactly these state keys: ${input.stateHints.join(', ')}.`
      : '- Include meaningful default states for the component (e.g. idle/loading/error/success where appropriate).'

  return [
    'Generate a single Atelier frame file in TypeScript/TSX.',
    'Output only code. No markdown fences. No explanations.',
    '',
    'Hard requirements:',
    `- Import the source component exactly as: ${input.componentImportStatement}`,
    "- Import types exactly as: import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'",
    `- Export typed meta: export const meta: MockMeta${makeVariantGeneric(input.variants)} = { ... }`,
    `- Declare typed states: const states: Record<StateKey, ComponentState${makeVariantGeneric(input.variants)}> = { ... }`,
    '- Every state must include a concise, user-facing description.',
    "- Every state's render must return JSX with a stable root key that includes the state name.",
    '- End with: export default states',
    statesLine,
    variantMetaLine,
    `- Use category "${input.category}" and tags ${JSON.stringify(input.tags)}.`,
    `- Use name "${input.componentName}" in meta.name.`,
    '',
    'Source component code (only source of truth):',
    `\n${input.componentSource}`,
  ].join('\n')
}
