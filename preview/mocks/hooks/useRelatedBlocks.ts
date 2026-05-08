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

type UseRelatedBlocksFn = () => UseRelatedBlocksResult

let _impl: UseRelatedBlocksFn = () => ({
  blocks: [],
  status: 'idle',
  fromCache: false,
  generatedAt: null,
  refresh: () => {},
})

export function setUseRelatedBlocks(impl: UseRelatedBlocksFn): void {
  _impl = impl
}

export function useRelatedBlocks(
  _canvasId: unknown,
  _hasRelatedBeenOpened: unknown,
): UseRelatedBlocksResult {
  return _impl()
}
