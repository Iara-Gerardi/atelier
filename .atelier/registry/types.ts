import type { ReactNode } from 'react'

export type StateKey = string

export interface ComponentState {
  render: () => ReactNode
  description?: string
}

export interface MockMeta {
  name: string
  category: string
  tags?: string[]
}

export interface RegistryEntry extends MockMeta {
  states: Record<StateKey, ComponentState>
}
