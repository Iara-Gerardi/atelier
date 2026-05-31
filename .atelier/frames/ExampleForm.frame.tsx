'use client'

import { useEffect, useRef } from 'react'
import ExampleForm from '@/components/ExampleForm'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'ExampleForm',
  category: 'Components',
  tags: [],
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function AutoSubmitExampleForm({
  stateName,
  email,
  onSubmit,
  autoSubmit = false,
}: {
  stateName: string
  email: string
  onSubmit: (data: { email: string }) => Promise<void>
  autoSubmit?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!autoSubmit || submittedRef.current) return

    submittedRef.current = true

    const timer = setTimeout(() => {
      const root = rootRef.current
      const input = root?.querySelector('input[type="email"]') as HTMLInputElement | null
      const form = root?.querySelector('form') as HTMLFormElement | null

      if (!input || !form) return

      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(input, email)

      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))

      setTimeout(() => form.requestSubmit(), 0)
    }, 100)

    return () => clearTimeout(timer)
  }, [autoSubmit, email])

  return (
    <div ref={rootRef} key={`example-form-${stateName}-scenario`}>
      <ExampleForm onSubmit={onSubmit} />
    </div>
  )
}
const states: Record<StateKey, ComponentState> = {
  idle: {
    description: 'Default waitlist form ready for an email address.',
    render: () => (
      <div key="example-form-idle" className="flex min-h-80 items-center justify-center bg-gray-50 p-8">
        <AutoSubmitExampleForm
          stateName="idle"
          email="person@example.com"
          onSubmit={async () => {
            await delay(300)
          }}
        />
      </div>
    ),
  },
  loading: {
    description: 'Shows the form while a waitlist request is submitting.',
    render: () => (
      <div key="example-form-loading" className="flex min-h-80 items-center justify-center bg-gray-50 p-8">
        <AutoSubmitExampleForm
          stateName="loading"
          email="loading@example.com"
          autoSubmit
          onSubmit={() => new Promise<void>(() => {})}
        />
      </div>
    ),
  },
  error: {
    description: 'Displays a helpful message when signup fails.',
    render: () => (
      <div key="example-form-error" className="flex min-h-80 items-center justify-center bg-gray-50 p-8">
        <AutoSubmitExampleForm
          stateName="error"
          email="error@example.com"
          autoSubmit
          onSubmit={async () => {
            await delay(250)
            throw new Error('We could not join the waitlist. Please try again.')
          }}
        />
      </div>
    ),
  },
  success: {
    description: 'Confirms the email was added to the waitlist.',
    render: () => (
      <div key="example-form-success" className="flex min-h-80 items-center justify-center bg-gray-50 p-8">
        <AutoSubmitExampleForm
          stateName="success"
          email="success@example.com"
          autoSubmit
          onSubmit={async () => {
            await delay(250)
          }}
        />
      </div>
    ),
  },
}

export default states
