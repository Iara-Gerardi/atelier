import ExampleCard from '@/components/ExampleCard'
import { setGetUserProfile } from '@/actions/user'
import { GetUserProfileError } from '@/actions/user.types'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'ExampleCard',
  category: 'Data Display',
  tags: ['user', 'profile'],
}

function fulfilled<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status: string; value: T }
  p.status = 'fulfilled'
  p.value = value
  return p
}

function rejected<T>(reason: unknown): Promise<T> {
  const p = Promise.reject(reason) as Promise<T> & { status: string; reason: unknown }
  p.catch(() => { })
  p.status = 'rejected'
  p.reason = reason
  return p
}

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton placeholder while the user profile is fetching',
    render: () => {
      setGetUserProfile(() => new Promise(() => { }))
      return <ExampleCard key="loading" />
    },
  },
  error: {
    description: 'Network error returned from the user endpoint',
    render: () => {
      setGetUserProfile(() =>
        rejected(new GetUserProfileError('Could not load profile — network request failed (503).', '503')),
      )
      return <ExampleCard key="error" />
    },
  },
  success: {
    description: 'Fully loaded admin user',
    render: () => {
      setGetUserProfile(() =>
        fulfilled({
          id: 'usr_01HXKQ7M5WVBD93JRZP6CFTN4E',
          name: 'Margot Bellamy',
          email: 'margot.bellamy@acme.io',
          role: 'admin' as const,
        }),
      )
      return <ExampleCard key="success" />
    },
  },
}

export default states
