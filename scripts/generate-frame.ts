import { runGenerateFrame } from '../ai/tools/generate-frame'

interface CliArgs {
  src?: string
  category?: string
  tags?: string[]
  states?: string[]
  variants?: string[]
  outputPath?: string
  model?: string
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseArgs(argv: string[]): CliArgs {
  const parsed: CliArgs = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) {
      if (!parsed.src) parsed.src = token
      continue
    }
    const next = argv[i + 1]
    if (!next) continue

    switch (token) {
      case '--src':
        parsed.src = next
        i += 1
        break
      case '--category':
        parsed.category = next
        i += 1
        break
      case '--tags':
        parsed.tags = parseList(next)
        i += 1
        break
      case '--states':
        parsed.states = parseList(next)
        i += 1
        break
      case '--variants':
        parsed.variants = parseList(next)
        i += 1
        break
      case '--output':
        parsed.outputPath = next
        i += 1
        break
      case '--model':
        parsed.model = next
        i += 1
        break
      default:
        break
    }
  }

  // Supports `npm run gen-frame --src Foo` (without npm's "--" passthrough)
  if (!parsed.src && typeof process.env.npm_config_src === 'string' && process.env.npm_config_src !== 'true') {
    parsed.src = process.env.npm_config_src
  }
  if (!parsed.category && typeof process.env.npm_config_category === 'string') {
    parsed.category = process.env.npm_config_category
  }
  if (!parsed.tags && typeof process.env.npm_config_tags === 'string') {
    parsed.tags = parseList(process.env.npm_config_tags)
  }
  if (!parsed.states && typeof process.env.npm_config_states === 'string') {
    parsed.states = parseList(process.env.npm_config_states)
  }
  if (!parsed.variants && typeof process.env.npm_config_variants === 'string') {
    parsed.variants = parseList(process.env.npm_config_variants)
  }
  if (!parsed.outputPath && typeof process.env.npm_config_output === 'string') {
    parsed.outputPath = process.env.npm_config_output
  }
  if (!parsed.model && typeof process.env.npm_config_model === 'string') {
    parsed.model = process.env.npm_config_model
  }

  return parsed
}

function usage(): string {
  return [
    'Usage:',
    '  npm run gen-frame --src <ComponentName> [--category <value>] [--tags a,b] [--states a,b] [--variants a,b] [--output <path>] [--model <id>]',
    '',
    'Example:',
    '  npm run gen-frame --src StatusCard --category Cards --tags ui,status --states idle,loading,error',
  ].join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.src) {
    console.error(usage())
    process.exitCode = 1
    return
  }

  const componentPath = `components/${args.src}.tsx`
  const result = await runGenerateFrame({
    componentPath,
    componentName: args.src,
    category: args.category ?? 'Components',
    tags: args.tags ?? [],
    stateHints: args.states ?? [],
    variants: args.variants ?? [],
    outputPath: args.outputPath,
    mode: 'write',
    ...(args.model ? { model: args.model } : {}),
  })

  console.log(`Generated frame: ${result.outputPath}`)
  console.log(`Component source: ${result.componentPath}`)
  console.log(`Model: ${result.model}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`gen-frame failed: ${message}`)
  process.exitCode = 1
})
