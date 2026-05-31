import { gateway, wrapLanguageModel } from 'ai'
import { devToolsMiddleware } from '@ai-sdk/devtools'

export function createWrappedGatewayModel(modelId: string) {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: devToolsMiddleware(),
  })
}
