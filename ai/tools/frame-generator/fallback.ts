function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function toObjectKey(value: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : quote(value)
}

export function shouldUseTemplateFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('Missing API key') ||
    message.includes('insufficient_quota') ||
    message.includes('(401)') ||
    message.includes('(403)') ||
    message.includes('(429)')
  )
}

export function buildFallbackFrameSource(input: {
  componentName: string
  componentImportStatement: string
  category: string
  tags: string[]
  stateHints: string[]
  variants: string[]
  stateAxisProp?: string
  requiredPrimitiveProps: Array<{ name: string; type: 'string' | 'number' | 'boolean' }>
}): string {
  const {
    componentName,
    componentImportStatement,
    category,
    tags,
    stateHints,
    variants,
    stateAxisProp,
    requiredPrimitiveProps,
  } = input
  const states = stateHints.length > 0 ? stateHints : ['default']
  const metaLines = [
    `  name: ${quote(componentName)},`,
    `  category: ${quote(category)},`,
    `  tags: [${tags.map(quote).join(', ')}],`,
  ]

  if (variants.length > 0) {
    metaLines.push(`  variants: [${variants.map(quote).join(', ')}] as const,`)
  }

  function buildRenderProps(state: string): string[] {
    const props: string[] = []

    if (stateAxisProp) {
      props.push(`      ${stateAxisProp}=${quote(state)}`)
    }

    for (const prop of requiredPrimitiveProps) {
      if (stateAxisProp && prop.name === stateAxisProp) continue
      if (prop.type === 'string') {
        props.push(`      ${prop.name}=${quote(`${componentName} ${state} ${prop.name}`)}`)
      } else if (prop.type === 'number') {
        props.push(`      ${prop.name}={0}`)
      } else {
        props.push(`      ${prop.name}={false}`)
      }
    }

    return props
  }

  const stateBlock = states
    .map((state) => {
      const renderProps = buildRenderProps(state)
      const renderNode =
        renderProps.length > 0
          ? `<${componentName}\n${renderProps.join('\n')}\n    />`
          : `<${componentName} />`

      return `  ${toObjectKey(state)}: {
    description: ${quote(`${state} state for ${componentName}.`)},
    render: () => ${renderNode},
  },`
    })
    .join('\n')

  return `import type { StateKey, ComponentState, MockMeta as MockFrame } from '@/.atelier/registry/types'
${componentImportStatement}

export const meta: MockFrame = {
${metaLines.join('\n')}
}

const states: Record<StateKey, ComponentState> = {
${stateBlock}
}

export default states
`
}
