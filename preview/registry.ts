import type { RegistryEntry } from '@/registry/types'
import exampleCardStates from './mocks/ExampleCard.mock'
import exampleFormStates from './mocks/ExampleForm.mock'
import exampleProductListStates from './mocks/ExampleProductList.mock'
import exampleRelatedBlocksStates from './mocks/ExampleRelatedBlocks.mock'

export const registry: RegistryEntry[] = [
  { name: 'ExampleCard', category: 'Data Display', states: exampleCardStates },
  { name: 'ExampleForm', category: 'Forms', states: exampleFormStates },
  { name: 'ExampleProductList', category: 'Commerce', states: exampleProductListStates },
  { name: 'ExampleRelatedBlocks', category: 'Are.na', states: exampleRelatedBlocksStates },
]
