import { StatusCard } from '@/components/StatusCard'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'StatusCard',
  category: 'Components',
  tags: ['card', 'status'],
}

const states: Record<StateKey, ComponentState> = {
  success: {
    description: 'Positive outcome — green tone with a check icon',
    render: () => (
      <StatusCard
        key="success"
        tone="success"
        title="Student added"
        body="The record was created and is now visible to staff."
      />
    ),
  },
  error: {
    description: 'Failure — red tone with an alert icon',
    render: () => (
      <StatusCard
        key="error"
        tone="error"
        title="Could not add student"
        body="The server rejected the submission. Try again."
      />
    ),
  },
  pending: {
    description: 'Awaiting action — amber tone with an hourglass icon',
    render: () => (
      <StatusCard
        key="pending"
        tone="pending"
        title="Pending review"
        body="An administrator must approve this record before it goes live."
      />
    ),
  },
}

export default states
