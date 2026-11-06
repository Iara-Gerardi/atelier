import type { GenerateStateManifestInput } from './schema'
import { generateStateManifestInputSchema } from './schema'
import { runGenerateStateManifest } from './run'

export const generateStateManifestTool = {
  name: 'generateStateManifest',
  description:
    'Extract React component state candidates with the TypeScript AST, validate them with Jev, and return a YAML manifest.',
  parameters: generateStateManifestInputSchema,
  execute: async (input: GenerateStateManifestInput) =>
    runGenerateStateManifest(input, { calledFrom: 'tool' }),
}
