import type { SearchBlock, SearchChannel, UseArenaSearchResult } from '../../../hooks/useArenaSearch.types'

export type { SearchBlock, SearchChannel, UseArenaSearchResult }

type UseArenaSearchFn = (query: string) => UseArenaSearchResult

let _impl: UseArenaSearchFn = () => ({
  blocks: [],
  channels: [],
  isLoading: false,
  loadMore: () => { },
  hasMore: false,
  error: null,
  retry: () => { },
})

export function setUseArenaSearch(impl: UseArenaSearchFn): void {
  _impl = impl
}

export function useArenaSearch(query: string): UseArenaSearchResult {
  return _impl(query)
}
