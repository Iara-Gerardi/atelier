import ExampleSearchTab from '@/components/ExampleSearchTab'
import { setUseArenaSearch } from '@/hooks/useArenaSearch'
import { setUseRateLimit } from '@/hooks/useRateLimit'
import type { StateKey, ComponentState } from '@/registry/types'

const MOCK_BLOCKS = [
  { id: 1, title: 'Brutalist Architecture Study', image_url: null, class: 'Image' },
  { id: 2, title: 'Notes on vernacular form', image_url: null, class: 'Text' },
  { id: 3, title: 'Grid systems in Swiss design', image_url: null, class: 'Text' },
  { id: 4, title: 'Material textures reference', image_url: null, class: 'Image' },
]

const MOCK_CHANNELS = [
  { id: 10, title: 'Minimal Aesthetics', length: 234, user: { username: 'clarabueno' } },
  { id: 11, title: 'Structural Compositions', length: 87, user: { username: 'nuno.silva' } },
]

const noRateLimit = () => setUseRateLimit(() => ({ resetAt: null, isExhausted: false }))

const states: Record<StateKey, ComponentState> = {
  idle: {
    description: 'No query — prompt to start searching',
    render: () => {
      setUseArenaSearch(() => ({ blocks: [], channels: [], isLoading: false, loadMore: () => {}, hasMore: false, error: null, retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="idle" />
    },
  },
  loading: {
    description: 'Query entered, results loading — skeleton shown',
    render: () => {
      setUseArenaSearch(() => ({ blocks: [], channels: [], isLoading: true, loadMore: () => {}, hasMore: false, error: null, retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="loading" initialQuery="minimal" />
    },
  },
  empty: {
    description: 'Query returned no results',
    render: () => {
      setUseArenaSearch(() => ({ blocks: [], channels: [], isLoading: false, loadMore: () => {}, hasMore: false, error: null, retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="empty" initialQuery="xyzqwerty" />
    },
  },
  error: {
    description: 'Search failed — error message with retry button',
    render: () => {
      setUseArenaSearch(() => ({ blocks: [], channels: [], isLoading: false, loadMore: () => {}, hasMore: false, error: new Error('Connection failed'), retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="error" initialQuery="minimal" />
    },
  },
  success: {
    description: 'Blocks and channels returned, no more pages',
    render: () => {
      setUseArenaSearch(() => ({ blocks: MOCK_BLOCKS, channels: MOCK_CHANNELS, isLoading: false, loadMore: () => {}, hasMore: false, error: null, retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="success" initialQuery="minimal" />
    },
  },
  load_more: {
    description: 'More pages available — load more button active',
    render: () => {
      setUseArenaSearch(() => ({ blocks: MOCK_BLOCKS, channels: MOCK_CHANNELS, isLoading: false, loadMore: () => {}, hasMore: true, error: null, retry: () => {} }))
      noRateLimit()
      return <ExampleSearchTab key="load_more" initialQuery="minimal" />
    },
  },
  rate_limited: {
    description: 'Load more disabled — Are.na rate limit exhausted, reset time shown in tooltip',
    render: () => {
      setUseArenaSearch(() => ({ blocks: MOCK_BLOCKS, channels: MOCK_CHANNELS, isLoading: false, loadMore: () => {}, hasMore: true, error: null, retry: () => {} }))
      setUseRateLimit(() => ({ resetAt: Math.floor(Date.now() / 1000) + 3600, isExhausted: true }))
      return <ExampleSearchTab key="rate_limited" initialQuery="minimal" />
    },
  },
}

export default states
