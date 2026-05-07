import type { StateKey, ComponentState } from '../types'

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Skeleton placeholder while the user profile is fetching',
    props: {
      isLoading: true,
    },
  },
  error: {
    description: 'Network error returned from the user endpoint',
    props: {
      isLoading: false,
      error: 'Could not load profile — network request failed (503).',
    },
  },
  success: {
    description: 'Fully loaded admin user',
    props: {
      isLoading: false,
      user: {
        id: 'usr_01HXKQ7M5WVBD93JRZP6CFTN4E',
        name: 'Margot Bellamy',
        email: 'margot.bellamy@acme.io',
        role: 'admin',
      },
    },
  },
}

export default states
