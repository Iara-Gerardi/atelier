import type { GenerateFrameInput } from './schema'
import { generateFrameInputSchema } from './schema'
import { runGenerateFrame } from './run'

export const generateFrameTool = {
  name: 'generateFrame',
  description: 'Generate a typed Atelier frame from a single component source file.',
  parameters: generateFrameInputSchema,
  execute: async (input: GenerateFrameInput) => runGenerateFrame(input),
}
