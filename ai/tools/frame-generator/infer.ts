import { escapeRegExp } from './shared'

const STATEFUL_PROP_NAMES = new Set([
  'state',
  'status',
  'variant',
  'tone',
  'mode',
  'kind',
  'type',
  'intent',
  'severity',
  'phase',
  'step',
])

const BOOLEAN_STATE_NAMES = [
  'loading',
  'error',
  'success',
  'pending',
  'empty',
  'disabled',
]

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export interface InferredStateAxis {
  propName: string
  states: string[]
}

export interface InferredPrimitiveProp {
  name: string
  type: 'string' | 'number' | 'boolean'
  optional: boolean
}

function inferUnionStateLiterals(typeChunk: string): string[] {
  const values: string[] = []
  for (const token of typeChunk.matchAll(/"([^"]+)"|'([^']+)'/g)) {
    const literal = token[1] ?? token[2]
    if (literal) values.push(literal)
  }
  return unique(values)
}

export function inferPrimaryStateAxis(componentSource: string): InferredStateAxis | null {
  const propPattern = /(\w+)(\?)?\s*:\s*([^;\n]+)/g
  for (const match of componentSource.matchAll(propPattern)) {
    const propName = match[1]?.toLowerCase()
    const typeChunk = match[3] ?? ''
    if (!propName || !STATEFUL_PROP_NAMES.has(propName)) continue
    if (!typeChunk.includes('|')) continue
    const states = inferUnionStateLiterals(typeChunk)
    if (states.length > 0) {
      return { propName: match[1], states }
    }
  }
  return null
}

export function inferStateHints(componentSource: string): string[] {
  const inferred: string[] = []

  const primaryAxis = inferPrimaryStateAxis(componentSource)
  if (primaryAxis) {
    inferred.push(...primaryAxis.states)
  }

  const booleanPattern = /(\w+)(\?)?\s*:\s*boolean\b/g
  for (const match of componentSource.matchAll(booleanPattern)) {
    const propName = match[1]?.toLowerCase()
    if (!propName) continue
    if (BOOLEAN_STATE_NAMES.includes(propName)) {
      inferred.push(propName)
    }
  }

  return unique(inferred)
}

export function inferPrimitiveProps(componentSource: string): InferredPrimitiveProp[] {
  const propPattern = /(\w+)(\?)?\s*:\s*([^;\n]+)/g
  const props: InferredPrimitiveProp[] = []

  for (const match of componentSource.matchAll(propPattern)) {
    const name = match[1]
    const optional = Boolean(match[2])
    const rawType = (match[3] ?? '').trim()
    if (rawType !== 'string' && rawType !== 'number' && rawType !== 'boolean') continue
    props.push({ name, type: rawType, optional })
  }

  return props
}

export function buildComponentImportStatement(
  componentSource: string,
  componentName: string,
  componentImportPath: string
): string {
  const escapedName = escapeRegExp(componentName)
  const hasDefaultExport =
    new RegExp(`export\\s+default\\s+function\\s+${escapedName}\\b`).test(componentSource) ||
    new RegExp(`export\\s+default\\s+${escapedName}\\b`).test(componentSource)

  return hasDefaultExport
    ? `import ${componentName} from '${componentImportPath}'`
    : `import { ${componentName} } from '${componentImportPath}'`
}
