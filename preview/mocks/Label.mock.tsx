import { Label } from '@/components/ui/Label'
import type { StateKey, ComponentState, MockMeta } from '@/registry/types'

export const meta: MockMeta = {
  name: 'Label',
  category: 'UI',
  tags: ['ui', 'forms'],
}

const states: Record<StateKey, ComponentState> = {
  default: {
    description: 'Standard form label',
    render: () => <Label key="default">Email address</Label>,
  },
  required: {
    description: 'Required field — shows red asterisk suffix',
    render: () => <Label key="required" required>Email address</Label>,
  },
}

export default states
