import type { RegistryEntry } from '@/registry/types'
import exampleCardStates from './mocks/ExampleCard.mock'
import exampleFormStates from './mocks/ExampleForm.mock'
import exampleProductListStates from './mocks/ExampleProductList.mock'
import exampleRelatedBlocksStates from './mocks/ExampleRelatedBlocks.mock'

export const registry: RegistryEntry[] = [
  { name: 'ExampleCard', category: 'Data Display', tags: ['user', 'profile'], states: exampleCardStates },
  { name: 'ExampleForm', category: 'Forms', tags: ['user', 'waitlist'], states: exampleFormStates },
  { name: 'ExampleProductList', category: 'Commerce', tags: ['checkout', 'products'], states: exampleProductListStates },
  { name: 'ExampleRelatedBlocks', category: 'Are.na', tags: ['arena', 'discovery'], states: exampleRelatedBlocksStates },
]
