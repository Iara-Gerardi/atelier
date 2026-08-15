import { z } from 'zod'

export const generateSceneInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Scene name in PascalCase. Used for meta.name and the <Name>.scene.tsx file name.'),
  description: z
    .string()
    .default('')
    .describe('Plain-language description of the user flow to wire (screens and transitions).'),
  category: z.string().min(1).default('Flows'),
  tags: z.array(z.string().min(1)).default([]),
  entryFrame: z
    .string()
    .min(1)
    .describe('Frame name of the initial node (must exist in .atelier/mocks/).'),
  entryState: z
    .string()
    .default('')
    .describe("Initial state on the entry frame. Defaults to the frame's first declared state."),
  frames: z
    .array(z.string().min(1))
    .default([])
    .describe('Frame names this scene may wire together. Empty means any registered frame is allowed.'),
  mode: z.enum(['preview', 'write']).default('preview'),
  outputPath: z
    .string()
    .min(1)
    .optional()
    .describe('Optional output path; defaults to .atelier/scenes/<Name>.scene.tsx.'),
  model: z
    .string()
    .min(1)
    .optional()
    .describe('Optional model id; defaults to the provider model from .atelier/ai.config.json.'),
})

export type GenerateSceneInput = z.input<typeof generateSceneInputSchema>
export type GenerateSceneInputParsed = z.output<typeof generateSceneInputSchema>

export interface GenerateSceneResult {
  mode: 'preview' | 'write'
  outputPath: string
  sceneSource: string
  sceneName: string
  model: string
}
