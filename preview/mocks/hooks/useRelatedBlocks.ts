import type { RelatedBlock, RelatedBlocksStatus, UseRelatedBlocksResult } from '../../../hooks/useRelatedBlocks.types'

export type { RelatedBlock, RelatedBlocksStatus, UseRelatedBlocksResult }

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
