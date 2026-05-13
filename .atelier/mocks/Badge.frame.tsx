import { Badge } from '@/components/ui/Badge'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'Badge',
  category: 'UI',
  tags: ['ui', 'label'],
}

const states: Record<StateKey, ComponentState> = {
  default: {
    description: 'Default (indigo) badge — used for prices and neutral values',
    render: () => <Badge key="default">$79.99</Badge>,
  },
  success: {
    description: 'Success badge — e.g. "In stock"',
    render: () => <Badge key="success" variant="success">In stock</Badge>,
  },
  error: {
    description: 'Error badge — e.g. "Out of stock"',
    render: () => <Badge key="error" variant="error">Out of stock</Badge>,
  },
  warning: {
    description: 'Warning badge — e.g. "Low stock"',
    render: () => <Badge key="warning" variant="warning">Low stock</Badge>,
  },
}

export default states
