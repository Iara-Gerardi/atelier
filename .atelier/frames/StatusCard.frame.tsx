import type { StateKey, ComponentState, MockMeta as MockFrame } from '@/.atelier/registry/types'
import { StatusCard } from '@/components/StatusCard'

export const meta: MockFrame = {
  name: 'StatusCard',
  category: 'Components',
  tags: [],
}

const states: Record<StateKey, ComponentState> = {
  success: {
    description: 'success state for StatusCard.',
    render: () => <StatusCard
      tone='success'
      title='StatusCard success title'
      body='StatusCard success body'
    />,
  },
  error: {
    description: 'error state for StatusCard.',
    render: () => <StatusCard
      tone='error'
      title='StatusCard error title'
      body='StatusCard error body'
    />,
  },
  pending: {
    description: 'pending state for StatusCard.',
    render: () => <StatusCard
      tone='pending'
      title='StatusCard pending title'
      body='StatusCard pending body'
    />,
  },
}

export default states
