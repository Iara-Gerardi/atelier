import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface SetupArgs {
  provider?: string
  model?: string
  apiKeyEnv?: string
  force?: boolean
}

interface ProviderDefaults {
  model: string
  apiKeyEnv: string
  /** npm package to install for direct providers; null for the gateway. */
  pkg: string | null
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  gateway: { model: 'openai/gpt-5.5', apiKeyEnv: 'AI_GATEWAY_API_KEY', pkg: null },
  openai: { model: 'gpt-5.5', apiKeyEnv: 'OPENAI_API_KEY', pkg: '@ai-sdk/openai' },
  anthropic: { model: 'claude-3-7-sonnet', apiKeyEnv: 'ANTHROPIC_API_KEY', pkg: '@ai-sdk/anthropic' },
  google: {
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
    pkg: '@ai-sdk/google',
  },
}

function parseArgs(argv: string[]): SetupArgs {
  const parsed: SetupArgs = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--force') {
      parsed.force = true
      continue
    }
    const next = argv[i + 1]
    if (!token.startsWith('--') || !next) continue
    switch (token) {
      case '--provider':
        parsed.provider = next
        i += 1
        break
      case '--model':
        parsed.model = next
        i += 1
        break
      case '--api-key-env':
        parsed.apiKeyEnv = next
        i += 1
        break
      default:
        break
    }
  }

  if (!parsed.provider && typeof process.env.npm_config_provider === 'string') {
    parsed.provider = process.env.npm_config_provider
  }
  if (!parsed.model && typeof process.env.npm_config_model === 'string') {
    parsed.model = process.env.npm_config_model
  }
  if (!parsed.apiKeyEnv && typeof process.env.npm_config_api_key_env === 'string') {
    parsed.apiKeyEnv = process.env.npm_config_api_key_env
  }

  return parsed
}

function usage(): string {
  return [
    'Configure the AI provider Atelier uses for frame/scene generation.',
    '',
    'Usage:',
    '  npm run atelier:setup --provider <gateway|openai|anthropic|google> [--model <id>] [--api-key-env <ENV>] [--force]',
    '',
    'Examples:',
    '  npm run atelier:setup --provider gateway',
    '  npm run atelier:setup --provider anthropic --model claude-3-7-sonnet',
  ].join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const provider = args.provider ?? 'gateway'
  const defaults = PROVIDER_DEFAULTS[provider]
  if (!defaults) {
    console.error(`Unknown provider "${provider}".`)
    console.error(usage())
    process.exitCode = 1
    return
  }

  const config = {
    provider,
    model: args.model ?? defaults.model,
    apiKeyEnv: args.apiKeyEnv ?? defaults.apiKeyEnv,
  }

  const rootDir = process.cwd()
  const configDir = path.resolve(rootDir, '.atelier')
  const configPath = path.resolve(configDir, 'ai.config.json')

  if (existsSync(configPath) && !args.force) {
    console.error(`.atelier/ai.config.json already exists. Re-run with --force to overwrite.`)
    process.exitCode = 1
    return
  }

  await mkdir(configDir, { recursive: true })
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

  console.log(`Wrote .atelier/ai.config.json:`)
  console.log(JSON.stringify(config, null, 2))
  console.log('')
  console.log(`Next steps:`)
  console.log(`  1. Set ${config.apiKeyEnv} in your environment (e.g. .env.local).`)
  if (defaults.pkg) {
    console.log(`  2. Install the provider SDK: npm install ${defaults.pkg}`)
  } else {
    console.log(`  2. The gateway needs no extra install — it ships with Atelier.`)
  }
  console.log(`  3. Generate: npm run gen-frame --src <Component> or npm run gen-scene --name <Scene> --entry-frame <Frame>`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`atelier:setup failed: ${message}`)
  process.exitCode = 1
})
