import { z } from 'zod'

export const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL ?? 'openai/gpt-5.5'

export const generateFrameInputSchema = z.object({
  componentPath: z.string().min(1).describe('Path to a component source file under components/.'),
  componentName: z
    .string()
    .min(1)
    .optional()
    .describe('Override component name used for frame naming/import symbol.'),
  category: z.string().min(1).default('Components'),
  tags: z.array(z.string().min(1)).default([]),
  stateHints: z
    .array(z.string().min(1))
    .default([])
    .describe('Optional desired state keys, e.g. ["idle","loading","error"].'),
  variants: z
    .array(z.string().min(1))
    .default([])
    .describe('Optional variant keys listed in meta.variants.'),
  mode: z.enum(['preview', 'write']).default('preview'),
  outputPath: z
    .string()
    .min(1)
    .optional()
    .describe('Optional output path; defaults to .atelier/frames/<ComponentName>.frame.tsx.'),
  model: z.string().min(1).default(DEFAULT_MODEL),
})

export type GenerateFrameInput = z.input<typeof generateFrameInputSchema>
export type GenerateFrameInputParsed = z.output<typeof generateFrameInputSchema>

export interface GenerateFrameResult {
  mode: 'preview' | 'write'
  outputPath: string
  frameSource: string
  componentPath: string
  componentImportPath: string
  model: string
}
