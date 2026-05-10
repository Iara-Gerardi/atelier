import { useState, useEffect, useCallback } from 'react'
export type { RelatedBlock, RelatedBlocksStatus, UseRelatedBlocksResult } from './useRelatedBlocks.types'
import type { RelatedBlock, RelatedBlocksStatus, UseRelatedBlocksResult } from './useRelatedBlocks.types'

export function useRelatedBlocks(
  canvasId: string,
  hasRelatedBeenOpened: boolean,
): UseRelatedBlocksResult {
  const [blocks, setBlocks] = useState<RelatedBlock[]>([])
  const [status, setStatus] = useState<RelatedBlocksStatus>('idle')
  const [fromCache, setFromCache] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  const fetch = useCallback(async () => {
    if (!hasRelatedBeenOpened) return
    setStatus('loading')
    try {
      // Real implementation: call your API here using canvasId
      void canvasId
      throw new Error('Not implemented')
    } catch {
      setStatus('error')
    }
  }, [canvasId, hasRelatedBeenOpened])

  useEffect(() => {
    fetch()
  }, [fetch])

  const refresh = useCallback(() => {
    setBlocks([])
    setFromCache(false)
    setGeneratedAt(null)
    fetch()
  }, [fetch])

  return { blocks, status, fromCache, generatedAt, refresh }
}
