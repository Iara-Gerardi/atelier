import type { ReactNode } from 'react'

export type StateKey = 'loading' | 'error' | 'success'

export interface ComponentState {
  render: () => ReactNode
  description?: string
}

export interface RegistryEntry {
  name: string
  category: string
  states: Record<StateKey, ComponentState>
}
