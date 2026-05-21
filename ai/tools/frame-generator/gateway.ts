import { loadEnvConfig } from '@next/env'

const FALLBACK_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/responses'
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
let envLoaded = false

function ensureProjectEnvLoaded(): void {
  if (envLoaded) return
  envLoaded = true
  loadEnvConfig(process.cwd())
}

function resolveGatewayUrl(): string {
  ensureProjectEnvLoaded()
  return process.env.AI_GATEWAY_URL ?? FALLBACK_GATEWAY_URL
}

function resolveApiKey(): string | undefined {
  ensureProjectEnvLoaded()
  return process.env.AI_GATEWAY_API_KEY
}

function resolveOpenAiApiKey(): string | undefined {
  ensureProjectEnvLoaded()
  return process.env.OPENAI_API_KEY
}

function normalizeModelForOpenAI(model: string): string {
  return model.startsWith('openai/') ? model.slice('openai/'.length) : model
}

async function requestText({
  url,
  apiKey,
  model,
  prompt,
}: {
  url: string
  apiKey: string
  model: string
  prompt: string
}): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          type: 'message',
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`request failed (${response.status}) at ${url}: ${body}`)
  }

  const payload = await response.json()
  return extractOutputText(payload)
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI response payload is not an object.')
  }

  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) {
    throw new Error('AI response did not include output messages.')
  }

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue

    for (const chunk of content) {
      if (!chunk || typeof chunk !== 'object') continue
      const typedChunk = chunk as { type?: unknown; text?: unknown }
      if (typedChunk.type === 'output_text' && typeof typedChunk.text === 'string') {
        return typedChunk.text
      }
    }
  }

  throw new Error('AI response had no output_text content.')
}

export async function generateFrameTextWithGateway(
  prompt: string,
  model: string
): Promise<string> {
  const gatewayApiKey = resolveApiKey()
  const openAiApiKey = resolveOpenAiApiKey()
  if (!gatewayApiKey && !openAiApiKey) {
    throw new Error(
      'Missing API key. Set AI_GATEWAY_API_KEY (or OPENAI_API_KEY) in your environment or .env file.'
    )
  }

  if (gatewayApiKey) {
    try {
      return await requestText({
        url: resolveGatewayUrl(),
        apiKey: gatewayApiKey,
        model,
        prompt,
      })
    } catch (error) {
      if (!openAiApiKey) throw error
      const message = error instanceof Error ? error.message : String(error)
      const gatewayAuthFailed = message.includes('(401)') || message.includes('(403)')
      if (!gatewayAuthFailed) {
        throw error
      }
    }
  }

  return requestText({
    url: OPENAI_RESPONSES_URL,
    apiKey: openAiApiKey as string,
    model: normalizeModelForOpenAI(model),
    prompt,
  })
}
