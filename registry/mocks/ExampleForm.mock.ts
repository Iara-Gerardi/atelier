import type { StateKey, ComponentState } from '../types'

const noop = (_data: { email: string }): void => {}

const states: Record<StateKey, ComponentState> = {
  loading: {
    description: 'Form in submitting state — button disabled and showing spinner',
    props: {
      isLoading: true,
      submitted: false,
      onSubmit: noop,
    },
  },
  error: {
    description: 'Server rejected the submission',
    props: {
      isLoading: false,
      submitted: false,
      error: 'That email is already registered. Try signing in instead.',
      onSubmit: noop,
    },
  },
  success: {
    description: 'Submission confirmed — success banner shown',
    props: {
      isLoading: false,
      submitted: true,
      onSubmit: noop,
    },
  },
}

export default states
