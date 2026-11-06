import { z } from 'zod'
import { parse } from 'yaml'
import type { Feature, Finding } from './types'
import { compare } from './source'

const relativeFile = z.string().min(1).refine(value => !value.startsWith('/') && !value.includes('\\') && !value.split('/').includes('..'), 'Use a repository-relative path without traversal')
const entry = z.object({ file: relativeFile, symbol: z.string().min(1).optional() }).strict()
export const featureSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  goal: z.string().min(1),
  entries: z.array(entry).min(1),
  exclude: z.array(entry).optional(),
  scenes: z.array(relativeFile).optional(),
}).strict()

export function readFeatures(files: Record<string, string>): { features: Feature[]; findings: Finding[] } {
  const features: Feature[] = []
  const findings: Finding[] = []
  for (const [file, source] of Object.entries(files)) {
    const match = /^features\/([^/]+)\/index\.md$/.exec(file)
    if (!match) continue
    try {
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
      if (!frontmatter) throw new Error('Missing YAML frontmatter')
      const feature = featureSchema.parse(parse(frontmatter[1]))
      if (feature.slug !== match[1]) throw new Error('slug must match the feature directory')
      features.push(feature)
    } catch (error) {
      findings.push({ code: 'invalid-feature', severity: 'error', file, message: String(error) })
    }
  }
  return { features: features.sort((a, b) => compare(a.slug, b.slug)), findings }
}
