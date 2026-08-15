import { runGenerateScene } from '../ai/tools/generate-scene'

interface CliArgs {
  name?: string
  description?: string
  category?: string
  tags?: string[]
  entryFrame?: string
  entryState?: string
  frames?: string[]
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
      if (!parsed.name) parsed.name = token
      continue
    }
    const next = argv[i + 1]
    if (!next) continue

    switch (token) {
      case '--name':
        parsed.name = next
        i += 1
        break
      case '--description':
        parsed.description = next
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
      case '--entry-frame':
        parsed.entryFrame = next
        i += 1
        break
      case '--entry-state':
        parsed.entryState = next
        i += 1
        break
      case '--frames':
        parsed.frames = parseList(next)
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

  // Supports `npm run gen-scene --name Foo` (without npm's "--" passthrough)
  if (!parsed.name && typeof process.env.npm_config_name === 'string' && process.env.npm_config_name !== 'true') {
    parsed.name = process.env.npm_config_name
  }
  if (!parsed.description && typeof process.env.npm_config_description === 'string') {
    parsed.description = process.env.npm_config_description
  }
  if (!parsed.category && typeof process.env.npm_config_category === 'string') {
    parsed.category = process.env.npm_config_category
  }
  if (!parsed.tags && typeof process.env.npm_config_tags === 'string') {
    parsed.tags = parseList(process.env.npm_config_tags)
  }
  if (!parsed.entryFrame && typeof process.env.npm_config_entry_frame === 'string') {
    parsed.entryFrame = process.env.npm_config_entry_frame
  }
  if (!parsed.entryState && typeof process.env.npm_config_entry_state === 'string') {
    parsed.entryState = process.env.npm_config_entry_state
  }
  if (!parsed.frames && typeof process.env.npm_config_frames === 'string') {
    parsed.frames = parseList(process.env.npm_config_frames)
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
    '  npm run gen-scene --name <SceneName> --entry-frame <FrameName> \\',
    '    [--entry-state <state>] [--frames a,b] [--description "..."] \\',
    '    [--category <value>] [--tags a,b] [--output <path>] [--model <id>]',
    '',
    'Example:',
    '  npm run gen-scene --name Checkout --entry-frame ExampleProductList --frames ExampleProductList,StatusCard',
  ].join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.name || !args.entryFrame) {
    console.error(usage())
    process.exitCode = 1
    return
  }

  const result = await runGenerateScene(
    {
      name: args.name,
      description: args.description ?? '',
      category: args.category ?? 'Flows',
      tags: args.tags ?? [],
      entryFrame: args.entryFrame,
      entryState: args.entryState ?? '',
      frames: args.frames ?? [],
      outputPath: args.outputPath,
      mode: 'write',
      ...(args.model ? { model: args.model } : {}),
    },
    { calledFrom: 'cli' }
  )

  console.log(`Generated scene: ${result.outputPath}`)
  console.log(`Scene name: ${result.sceneName}`)
  console.log(`Model: ${result.model}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`gen-scene failed: ${message}`)
  process.exitCode = 1
})
