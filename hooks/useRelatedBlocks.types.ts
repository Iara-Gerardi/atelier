export interface RelatedBlock {
  id: string | number
  [key: string]: unknown
}

export type RelatedBlocksStatus =
  | 'idle'
  | 'loading'
  | 'empty'
  | 'error'
  | 'rate_limited'
  | 'success'

export interface UseRelatedBlocksResult {
  blocks: RelatedBlock[]
  status: RelatedBlocksStatus
  fromCache: boolean
  generatedAt: Date | null
  refresh: () => void
}
