import { generateAtelierText } from '../provider'

/**
 * Thin wrapper kept for backwards compatibility. Provider selection, API-key
 * validation, and model construction all live in `ai/tools/provider.ts`, so the
 * frame generator works with the Vercel AI Gateway or any direct provider the
 * developer configured via `npm run atelier:setup`.
 */
export async function generateFrameTextWithGateway(prompt: string, model?: string): Promise<string> {
  return generateAtelierText({ prompt, model })
}
