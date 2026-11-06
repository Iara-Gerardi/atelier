import { z } from 'zod'
import type { StateCandidate } from './extract'

export const generateStateManifestInputSchema = z.object({
  componentPath: z
    .string()
    .min(1)
    .describe('Path to a React .jsx/.tsx source file under components/.'),
  componentName: z.string().min(1).optional(),
  mode: z.enum(['preview', 'write']).default('preview'),
  outputPath: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional YAML output path under .atelier/states/; defaults to <Component>.states.yaml.'
    ),
  review: z
    .boolean()
    .default(true)
    .describe('Validate every AST-extracted candidate with Jev in one AI SDK request.'),
  threshold: z.number().min(0).max(1).default(0.7),
  model: z.string().min(1).default('jev-latest'),
})

export type GenerateStateManifestInput = z.input<typeof generateStateManifestInputSchema>

export interface ManifestState extends StateCandidate {
  validityProbability: number | null
  valid: boolean | null
}

export interface ComponentStateManifest {
  schemaVersion: 1
  component: {
    name: string
    source: string
  }
  validation: {
    enabled: boolean
    model: string | null
    threshold: number
  }
  states: ManifestState[]
  summary: {
    candidates: number
    valid: number | null
    rejected: number | null
  }
}

export interface GenerateStateManifestResult {
  mode: 'preview' | 'write'
  outputPath: string
  componentPath: string
  manifest: ComponentStateManifest
  yaml: string
}
