import type { ReactNode } from 'react'

export type StateKey = string

export interface ComponentState {
  render: () => ReactNode
  description?: string
}

export interface RegistryEntry {
  name: string
  category: string
  states: Record<StateKey, ComponentState>
}
