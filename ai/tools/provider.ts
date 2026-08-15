import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { loadEnvConfig } from '@next/env'
import { generateText, wrapLanguageModel } from 'ai'
import { devToolsMiddleware } from '@ai-sdk/devtools'
import { createWrappedGatewayModel } from './lm'

/**
 * Provider-agnostic AI access for the Atelier generators.
 *
 * Two routes are supported so any developer can use Atelier regardless of which
 * AI subscription they hold:
 *  - `gateway` (default): the Vercel AI Gateway proxies every provider behind a
 *    single key. Model ids are `provider/model` (e.g. `openai/gpt-5.5`).
 *  - a direct provider (`openai`, `anthropic`, `google`, ...): the matching
 *    `@ai-sdk/<provider>` package is loaded lazily and called with the user's own
 *    key. Model ids are bare (e.g. `gpt-5.5`, `claude-3-7-sonnet`).
 *
 * The active choice is read from `.atelier/ai.config.json` (written by
 * `npm run atelier:setup`) and may be overridden per call.
 */

export interface AtelierAiConfig {
  /** `gateway` or a direct provider name such as `openai`, `anthropic`, `google`. */
  provider: string
  /** Model id. Prefixed (`openai/gpt-5.5`) for the gateway, bare otherwise. */
  model: string
  /** Env var that holds the API key for the active provider. */
  apiKeyEnv: string
}

interface DirectProviderSpec {
  /** npm package to import lazily. */
  pkg: string
  /** Named export that creates the provider client. */
  factory: string
  /** Default env var for this provider's API key. */
  apiKeyEnv: string
}

const DIRECT_PROVIDERS: Record<string, DirectProviderSpec> = {
  openai: { pkg: '@ai-sdk/openai', factory: 'createOpenAI', apiKeyEnv: 'OPENAI_API_KEY' },
  anthropic: { pkg: '@ai-sdk/anthropic', factory: 'createAnthropic', apiKeyEnv: 'ANTHROPIC_API_KEY' },
  google: {
    pkg: '@ai-sdk/google',
    factory: 'createGoogleGenerativeAI',
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
}

const GATEWAY_DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL ?? 'openai/gpt-5.5'

let envLoaded = false
function ensureProjectEnvLoaded(rootDir: string): void {
  if (envLoaded) return
  envLoaded = true
  loadEnvConfig(rootDir)
}

/**
 * Resolve the active AI config from (in order of precedence): explicit env
 * overrides, `.atelier/ai.config.json`, then built-in gateway defaults.
 */
export function resolveAiConfig(rootDir: string = process.cwd()): AtelierAiConfig {
  ensureProjectEnvLoaded(rootDir)

  const fileConfig = readConfigFile(rootDir)
  const provider = process.env.ATELIER_AI_PROVIDER ?? fileConfig?.provider ?? 'gateway'
  const model =
    process.env.ATELIER_AI_MODEL ??
    fileConfig?.model ??
    (provider === 'gateway' ? GATEWAY_DEFAULT_MODEL : defaultModelFor(provider))
  const apiKeyEnv = fileConfig?.apiKeyEnv ?? defaultApiKeyEnvFor(provider)

  return { provider, model, apiKeyEnv }
}

function readConfigFile(rootDir: string): Partial<AtelierAiConfig> | null {
  const configPath = path.resolve(rootDir, '.atelier', 'ai.config.json')
  if (!existsSync(configPath)) return null
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as Partial<AtelierAiConfig>
    return parsed
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not parse .atelier/ai.config.json: ${message}`)
  }
}

function defaultApiKeyEnvFor(provider: string): string {
  if (provider === 'gateway') return 'AI_GATEWAY_API_KEY'
  return DIRECT_PROVIDERS[provider]?.apiKeyEnv ?? 'AI_GATEWAY_API_KEY'
}

function defaultModelFor(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'gpt-5.5'
    case 'anthropic':
      return 'claude-3-7-sonnet'
    case 'google':
      return 'gemini-2.0-flash'
    default:
      return GATEWAY_DEFAULT_MODEL
  }
}

/** The effective default model, used as a fallback when no model is supplied. */
export function resolveDefaultModel(rootDir: string = process.cwd()): string {
  return resolveAiConfig(rootDir).model
}

/** Throw a clear, actionable error when the active provider's key is missing. */
export function ensureApiKeyPresent(config: AtelierAiConfig, rootDir: string = process.cwd()): void {
  ensureProjectEnvLoaded(rootDir)

  if (config.provider === 'gateway') {
    const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY)
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY)
    if (!hasGatewayKey && !hasOpenAiKey) {
      throw new Error(
        'Missing API key. Set AI_GATEWAY_API_KEY (or OPENAI_API_KEY) in your environment or .env.local. Run `npm run atelier:setup` to configure your provider.'
      )
    }
    return
  }

  if (!process.env[config.apiKeyEnv]) {
    throw new Error(
      `Missing API key for provider "${config.provider}". Set ${config.apiKeyEnv} in your environment or .env.local. Run \`npm run atelier:setup\` to reconfigure.`
    )
  }
}

async function createProviderModel(config: AtelierAiConfig, model: string) {
  if (config.provider === 'gateway') {
    return createWrappedGatewayModel(model)
  }

  const spec = DIRECT_PROVIDERS[config.provider]
  if (!spec) {
    throw new Error(
      `Unknown AI provider "${config.provider}". Use "gateway" or one of: ${Object.keys(DIRECT_PROVIDERS).join(', ')}.`
    )
  }

  let mod: Record<string, unknown>
  try {
    mod = (await import(spec.pkg)) as Record<string, unknown>
  } catch {
    throw new Error(
      `Provider "${config.provider}" requires the ${spec.pkg} package. Install it with \`npm install ${spec.pkg}\`.`
    )
  }

  const factory = mod[spec.factory] as
    | ((options: { apiKey?: string }) => (modelId: string) => unknown)
    | undefined
  if (typeof factory !== 'function') {
    throw new Error(`${spec.pkg} does not export ${spec.factory}().`)
  }

  const client = factory({ apiKey: process.env[config.apiKeyEnv] })
  return wrapLanguageModel({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: client(model) as any,
    middleware: devToolsMiddleware(),
  })
}

/**
 * Generate text using the configured provider. `model` overrides the configured
 * default for a single call. Honors `.atelier/ai.config.json` and env overrides.
 */
export async function generateAtelierText(params: {
  prompt: string
  model?: string
  rootDir?: string
}): Promise<string> {
  const rootDir = params.rootDir ?? process.cwd()
  const config = resolveAiConfig(rootDir)
  const model = params.model ?? config.model
  ensureApiKeyPresent(config, rootDir)

  const result = await generateText({
    model: await createProviderModel(config, model),
    prompt: params.prompt,
  })
  return result.text
}
