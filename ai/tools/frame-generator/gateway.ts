import { loadEnvConfig } from '@next/env'
import { generateText } from 'ai'
import { createWrappedGatewayModel } from '../lm'

let envLoaded = false

function ensureProjectEnvLoaded(): void {
  if (envLoaded) return
  envLoaded = true
  loadEnvConfig(process.cwd())
}

function ensureApiKeyPresent(): void {
  ensureProjectEnvLoaded()
  const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY)
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY)

  if (!hasGatewayKey && !hasOpenAiKey) {
    throw new Error(
      'Missing API key. Set AI_GATEWAY_API_KEY (or OPENAI_API_KEY) in your environment or .env file.'
    )
  }
}

export async function generateFrameTextWithGateway(prompt: string, model: string): Promise<string> {
  ensureApiKeyPresent()
  const result = await generateText({
    model: createWrappedGatewayModel(model),
    prompt,
  })
  return result.text
}
