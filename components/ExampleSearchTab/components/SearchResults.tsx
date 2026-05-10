import type { SearchBlock, SearchChannel } from '@/hooks/useArenaSearch'
import { BlockItem } from './BlockItem'
import { ChannelItem } from './ChannelItem'
import { SearchSkeleton } from './SearchSkeleton'

export function SearchResults({
  blocks,
  channels,
  isLoading,
  query,
}: {
  blocks: SearchBlock[]
  channels: SearchChannel[]
  isLoading: boolean
  query: string
}) {
  if (!query) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <span className="text-2xl">🔍</span>
        <p className="text-xs text-gray-400">Type to search blocks and channels</p>
      </div>
    )
  }

  if (isLoading) {
    return <SearchSkeleton />
  }

  if (blocks.length === 0 && channels.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <span className="text-2xl">🌫️</span>
        <p className="text-xs text-gray-500">No results for &ldquo;{query}&rdquo;</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {channels.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Channels</p>
          {channels.map((ch) => <ChannelItem key={ch.id} channel={ch} />)}
        </div>
      )}
      {blocks.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Blocks</p>
          {blocks.map((b) => <BlockItem key={b.id} block={b} />)}
        </div>
      )}
    </div>
  )
}
