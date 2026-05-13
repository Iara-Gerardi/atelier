import type { RegistryEntry, MockMeta, ComponentState, StateKey } from './types'

type FrameModule = {
  default: Record<StateKey, ComponentState>
  meta: MockMeta
}

const frames = import.meta.glob<FrameModule>('../**/*.frame.tsx', { eager: true })

export const registry: RegistryEntry[] = Object.values(frames).map((mod) => ({
  ...mod.meta,
  states: mod.default,
}))
