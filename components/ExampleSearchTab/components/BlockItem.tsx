import type { SearchBlock } from '@/hooks/useArenaSearch'

export function BlockItem({ block }: { block: SearchBlock }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
        {block.class === 'Image' ? '🖼' : '📄'}
      </div>
      <span className="truncate text-sm text-gray-700">{block.title}</span>
    </div>
  )
}
