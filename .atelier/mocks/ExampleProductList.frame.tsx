import ExampleProductList from '@/components/ExampleProductList'
import { setGetProducts } from '@/actions/product'
import { GetProductsError } from '@/actions/product.types'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'ExampleProductList',
  category: 'Commerce',
  tags: ['checkout', 'products'],
}

const PRODUCTS = [
  { id: '1', name: 'Wireless Headphones', price: 79.99 },
  { id: '2', name: 'Mechanical Keyboard', price: 129.00 },
  { id: '3', name: 'USB-C Hub', price: 49.95 },
  { id: '4', name: 'Webcam 1080p', price: 89.99 },
  { id: '5', name: 'Monitor Stand', price: 34.50 },
  { id: '6', name: 'Desk Mat XL', price: 24.99 },
  { id: '7', name: 'LED Desk Lamp', price: 44.00 },
  { id: '8', name: 'Cable Organizer', price: 12.99 },
  { id: '9', name: 'Laptop Stand', price: 59.95 },
]

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Cards skeleton-ize while products are fetching',
    render: () => {
      setGetProducts(() => new Promise(() => { }))
      return <ExampleProductList key="loading" />
    },
  },
  error: {
    description: 'Server error returned from the products endpoint',
    render: () => {
      setGetProducts(() =>
        Promise.reject(
          new GetProductsError('Could not load products — service unavailable (503).', '503'),
        ),
      )
      return <ExampleProductList key="error" />
    },
  },
  success: {
    description: 'All 9 products loaded, paginated 3 per page',
    render: () => {
      setGetProducts(() => Promise.resolve(PRODUCTS))
      return <ExampleProductList key="success" />
    },
  },
}

export default states
