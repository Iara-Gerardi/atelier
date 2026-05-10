import { Button } from '@/components/ui/Button'
import type { StateKey, ComponentState, MockMeta } from '@/registry/types'

export const meta: MockMeta = {
  name: 'Button',
  category: 'UI',
  tags: ['ui', 'interactive'],
}

const states: Record<StateKey, ComponentState> = {
  primary: {
    description: 'Primary action button',
    render: () => <Button key="primary" variant="primary">Continue</Button>,
  },
  secondary: {
    description: 'Secondary / outlined button',
    render: () => <Button key="secondary" variant="secondary">Cancel</Button>,
  },
  ghost: {
    description: 'Ghost button for low-emphasis actions',
    render: () => <Button key="ghost" variant="ghost">Learn more</Button>,
  },
  small: {
    description: 'Small size variant',
    render: () => <Button key="small" size="sm">Save</Button>,
  },
  disabled: {
    description: 'Disabled state — cursor not-allowed, reduced opacity',
    render: () => <Button key="disabled" disabled>Submit</Button>,
  },
}

export default states
