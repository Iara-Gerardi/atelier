import type { ComponentType } from 'react'

export type StateKey = 'loading' | 'error' | 'success'

export interface ComponentState {
  props: Record<string, unknown>
  description?: string
}

export interface RegistryEntry {
  name: string
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  states: Record<StateKey, ComponentState>
}
