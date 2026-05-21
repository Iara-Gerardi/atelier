import type { StateKey, ComponentState, MockMeta as MockFrame } from '@/.atelier/registry/types'
import { StatusCard } from '@/components/StatusCard'

export const meta: MockFrame = {
  name: 'AddStudentStatus',
  category: 'Forms',
  tags: ['admin', 'demo'],
}


const states: Record<StateKey, ComponentState> = {
  success: {
    description: 'Student created — confirmation card with their generated ID.',
    render: () => (
      <StatusCard
        tone="success"
        title="Student added"
        body="Maya Lopez has been added to your class. Their welcome email is on the way."
      />
    ),
  },
  error: {
    description: 'Server rejected the submission (e.g. email already registered).',
    render: () => (
      <StatusCard
        tone="error"
        title="Could not add student"
        body="That email is already registered. Ask them to sign in or use a different address."
      />
    ),
  },
  // Not reachable as an outcome from the AddStudent `form` node — the
  // dropdown deliberately omits it. Still listed here so the StateBar can
  // preview it directly. Demonstrates the "states the StateBar shows vs.
  // states the outcome dropdown shows" split.
  pending_review: {
    description:
      'Pending administrator review — appears when an admin enrolment workflow defers the decision. Not directly reachable from the submit dropdown; preview it via the StateBar.',
    render: () => (
      <StatusCard
        tone="pending"
        title="Awaiting review"
        body="This enrolment requires administrator approval. You'll get an email once it's processed."
      />
    ),
  },
}

export default states
