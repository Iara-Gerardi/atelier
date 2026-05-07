import type { RegistryEntry } from '@/registry/types'
import exampleCardStates from './mocks/ExampleCard.mock'
import exampleFormStates from './mocks/ExampleForm.mock'

export const registry: RegistryEntry[] = [
  { name: 'ExampleCard', category: 'Data Display', states: exampleCardStates },
  { name: 'ExampleForm', category: 'Forms', states: exampleFormStates },
]
