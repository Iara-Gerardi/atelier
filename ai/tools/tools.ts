import { z } from 'zod'
import { generateText } from 'ai'
import { generateFrameTool } from './generate-frame'
import { createWrappedGatewayModel } from './lm'

const model = createWrappedGatewayModel('openai/gpt-4.1-mini')

export const generateTextTool = {
  name: 'generateText',
  description: 'Generate text using the OpenAI API',
  parameters: z.object({
    prompt: z.string(),
  }),
  execute: async ({ prompt }: { prompt: string }) => {
    const result = await generateText({ model, prompt })
    return result.text
  },
}

export { generateFrameTool }
