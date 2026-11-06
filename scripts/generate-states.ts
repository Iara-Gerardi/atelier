import { runGenerateStateManifest } from '../ai/tools/generate-states'

interface CliArgs {
  src?: string
  outputPath?: string
  threshold?: number
  model?: string
  review: boolean
  mode: 'preview' | 'write'
}

function parseArgs(argv: string[]): CliArgs {
  const parsed: CliArgs = { review: true, mode: 'write' }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      if (!parsed.src) parsed.src = token
      continue
    }
    const next = argv[index + 1]
    switch (token) {
      case '--src':
        if (next) {
          parsed.src = next
          index += 1
        }
        break
      case '--output':
        if (next) {
          parsed.outputPath = next
          index += 1
        }
        break
      case '--threshold':
        if (next) {
          parsed.threshold = Number(next)
          index += 1
        }
        break
      case '--model':
        if (next) {
          parsed.model = next
          index += 1
        }
        break
      case '--no-review':
        parsed.review = false
        break
      case '--preview':
        parsed.mode = 'preview'
        break
      default:
        break
    }
  }

  if (!parsed.src && typeof process.env.npm_config_src === 'string') {
    parsed.src = process.env.npm_config_src
  }
  return parsed
}

function componentPathFrom(value: string): string {
  if (/\.[jt]sx?$/i.test(value)) {
    return /^(?:\.\/)?components\//.test(value) || value.startsWith('/')
      ? value
      : `components/${value}`
  }
  return `components/${value}.tsx`
}

function usage(): string {
  return [
    'Usage:',
    '  npm run gen-states -- --src <component.jsx|component.tsx> [--threshold 0.7] [--output <path>] [--model jev-latest] [--no-review] [--preview]',
    '',
    'Example:',
    '  npm run gen-states -- --src components/ExampleForm.tsx',
  ].join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.src) {
    console.error(usage())
    process.exitCode = 1
    return
  }
  if (args.threshold !== undefined && (!Number.isFinite(args.threshold) || args.threshold < 0 || args.threshold > 1)) {
    throw new Error('--threshold must be a number from 0 to 1.')
  }

  const result = await runGenerateStateManifest(
    {
      componentPath: componentPathFrom(args.src),
      mode: args.mode,
      review: args.review,
      ...(args.outputPath ? { outputPath: args.outputPath } : {}),
      ...(args.threshold !== undefined ? { threshold: args.threshold } : {}),
      ...(args.model ? { model: args.model } : {}),
    },
    { calledFrom: 'cli' }
  )

  if (result.mode === 'preview') {
    process.stdout.write(result.yaml)
    return
  }
  console.log(`Generated state manifest: ${result.outputPath}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`gen-states failed: ${message}`)
  process.exitCode = 1
})
