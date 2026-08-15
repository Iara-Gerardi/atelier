import type { GenerateSceneInput } from './schema'
import { generateSceneInputSchema } from './schema'
import { runGenerateScene } from './run'

export const generateSceneTool = {
  name: 'generateScene',
  description:
    'Generate a typed Atelier scene that wires existing frames into a user flow. ' +
    'Outcomes are frame-to-frame transitions only.',
  parameters: generateSceneInputSchema,
  execute: async (input: GenerateSceneInput) => runGenerateScene(input, { calledFrom: 'tool' }),
}
