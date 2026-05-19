import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'AddStudentStatus',
  category: 'Forms',
  tags: ['admin', 'demo'],
}

interface CardProps {
  tone: 'success' | 'error' | 'pending'
  title: string
  body: string
}

function StatusCard({ tone, title, body }: CardProps) {
  const palette =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'
  const icon = tone === 'success' ? '✓' : tone === 'error' ? '!' : '⏳'
  return (
    <div className={`w-96 rounded-2xl border p-6 shadow-sm ${palette}`}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-80">{body}</p>
    </div>
  )
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
