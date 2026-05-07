import { useEffect, useRef } from 'react'
import ExampleForm from '@/components/ExampleForm'
import type { StateKey, ComponentState } from '@/registry/types'

type SubmitHandler = (data: { email: string }) => Promise<void>

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

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Form locked while the request is in-flight',
    render: () => (
      <AutoSubmitForm key="loading" onSubmit={() => new Promise(() => {})} />
    ),
  },
  error: {
    description: 'Server rejected the submission',
    render: () => (
      <AutoSubmitForm
        key="error"
        onSubmit={() => Promise.reject(new Error('That email is already registered. Try signing in instead.'))}
      />
    ),
  },
  success: {
    description: 'Submission confirmed — success banner shown',
    render: () => (
      <AutoSubmitForm key="success" onSubmit={() => Promise.resolve()} />
    ),
  },
}

export default states
