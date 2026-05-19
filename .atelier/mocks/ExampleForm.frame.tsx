import { useEffect, useRef } from 'react'
import ExampleForm from '@/components/ExampleForm'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta<'auth'> = {
  name: 'ExampleForm',
  category: 'Forms',
  tags: ['user', 'waitlist'],
  variants: ['auth'] as const,
}

type SubmitHandler = (data: { email: string }) => Promise<void>
type Auth = 'guest' | 'student' | 'professor' | 'admin'

function RoleChip({ auth }: { auth: Auth }) {
  const tone =
    auth === 'admin' || auth === 'professor'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
      : 'border-gray-200 bg-gray-50 text-gray-500'
  return (
    <div
      className={`mb-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}
    >
      <span>Acting as</span>
      <span>{auth}</span>
    </div>
  )
}

function AutoSubmitForm({ onSubmit }: { onSubmit: SubmitHandler }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const input = containerRef.current?.querySelector<HTMLInputElement>('input[type="email"]')
    const form = containerRef.current?.querySelector('form')
    if (!input || !form) return

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    nativeSetter?.call(input, 'preview@example.com')
    input.dispatchEvent(new Event('input', { bubbles: true }))

    setTimeout(() => form.requestSubmit(), 0)
  }, [])

  return (
    <div ref={containerRef}>
      <ExampleForm onSubmit={onSubmit} />
    </div>
  )
}

const states: Record<StateKey, ComponentState<'auth'>> = {
  idle: {
    description:
      'Unsubmitted form ready for input. In scene mode the submit button becomes a split dropdown of outcomes.',
    render: ({ variants }) => (
      // In standalone mode, clicking submit fires the real form. We resolve
      // immediately so the form completes its handler instead of hanging on a
      // never-resolving promise. In scene mode, the mocked Button intercepts
      // the click first and onSubmit is never reached.
      <div key={`idle-${variants.auth}`}>
        <RoleChip auth={variants.auth} />
        <ExampleForm onSubmit={() => Promise.resolve()} />
      </div>
    ),
  },
  loading: {
    description: 'Form locked while the request is in-flight',
    render: ({ variants }) => (
      <div key={`loading-${variants.auth}`}>
        <RoleChip auth={variants.auth} />
        <AutoSubmitForm onSubmit={() => new Promise(() => { })} />
      </div>
    ),
  },
  error: {
    description: 'Server rejected the submission',
    render: ({ variants }) => (
      <div key={`error-${variants.auth}`}>
        <RoleChip auth={variants.auth} />
        <AutoSubmitForm
          onSubmit={() => Promise.reject(new Error('That email is already registered. Try signing in instead.'))}
        />
      </div>
    ),
  },
  success: {
    description: 'Submission confirmed — success banner shown',
    render: ({ variants }) => (
      <div key={`success-${variants.auth}`}>
        <RoleChip auth={variants.auth} />
        <AutoSubmitForm onSubmit={() => Promise.resolve()} />
      </div>
    ),
  },
}

export default states
