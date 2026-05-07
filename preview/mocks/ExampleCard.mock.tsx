import ExampleCard from '@/components/ExampleCard'
import { setGetUserProfile } from '@/actions/user'
import { GetUserProfileError } from '@/actions/user.types'
import type { StateKey, ComponentState } from '@/registry/types'

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton placeholder while the user profile is fetching',
    render: () => {
      setGetUserProfile(() => new Promise(() => {}))
      return <ExampleCard key="loading" />
    },
  },
  error: {
    description: 'Network error returned from the user endpoint',
    render: () => {
      setGetUserProfile(() =>
        Promise.reject(new GetUserProfileError('Could not load profile — network request failed (503).', '503')),
      )
      return <ExampleCard key="error" />
    },
  },
  success: {
    description: 'Fully loaded admin user',
    render: () => {
      setGetUserProfile(() =>
        Promise.resolve({
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
