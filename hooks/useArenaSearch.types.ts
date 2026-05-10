export interface SearchBlock {
  id: string | number
  title: string
  image_url?: string | null
  class: string
}

export interface SearchChannel {
  id: string | number
  title: string
  length: number
  user: { username: string }
}

export interface UseArenaSearchResult {
  blocks: SearchBlock[]
  channels: SearchChannel[]
  isLoading: boolean
  loadMore: () => void
  hasMore: boolean
  error: Error | null
  retry: () => void
}
