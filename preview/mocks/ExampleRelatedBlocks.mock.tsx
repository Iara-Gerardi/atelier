import ExampleRelatedBlocks from '@/components/ExampleRelatedBlocks'
import { setUseRelatedBlocks } from '@/hooks/useRelatedBlocks'
import type { StateKey, ComponentState } from '@/registry/types'

const MOCK_BLOCKS = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  title: `Block ${i + 1}`,
  image_url: null,
}))

const states: Record<StateKey, ComponentState> = {
  idle: {
    description: 'Initial state — user has not opened the tab yet',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: [], status: 'idle', fromCache: false, generatedAt: null, refresh: () => {} }))
      return <ExampleRelatedBlocks key="idle" />
    },
  },
  loading: {
    description: 'Fetching related blocks — grid skeleton shown',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: [], status: 'loading', fromCache: false, generatedAt: null, refresh: () => {} }))
      return <ExampleRelatedBlocks key="loading" />
    },
  },
  empty: {
    description: 'Not enough images on the canvas to generate suggestions',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: [], status: 'empty', fromCache: false, generatedAt: null, refresh: () => {} }))
      return <ExampleRelatedBlocks key="empty" />
    },
  },
  error: {
    description: 'Network or server error — retry button shown',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: [], status: 'error', fromCache: false, generatedAt: null, refresh: () => {} }))
      return <ExampleRelatedBlocks key="error" />
    },
  },
  rate_limited: {
    description: 'Are.na API rate limit reached',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: [], status: 'rate_limited', fromCache: false, generatedAt: null, refresh: () => {} }))
      return <ExampleRelatedBlocks key="rate_limited" />
    },
  },
  success: {
    description: '18 related blocks returned and displayed in grid',
    render: () => {
      setUseRelatedBlocks(() => ({ blocks: MOCK_BLOCKS, status: 'success', fromCache: false, generatedAt: new Date(), refresh: () => {} }))
      return <ExampleRelatedBlocks key="success" />
    },
  },
}

export default states
