import type { RegistryEntry } from './types'
import ExampleCard from '@/components/ExampleCard'
import ExampleForm from '@/components/ExampleForm'
import exampleCardStates from './mocks/ExampleCard.mock'
import exampleFormStates from './mocks/ExampleForm.mock'

export const registry: RegistryEntry[] = [
  {
    name: 'ExampleCard',
    category: 'Data Display',
    component: ExampleCard,
    states: exampleCardStates,
  },
  {
    name: 'ExampleForm',
    category: 'Forms',
    component: ExampleForm,
    states: exampleFormStates,
  },
]
