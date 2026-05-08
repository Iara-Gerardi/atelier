'use client'

import { useRelatedBlocks } from '../hooks/useRelatedBlocks'
import type { RelatedBlock } from '../hooks/useRelatedBlocks'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArenaStatusMessage({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  )
}

function ArenaSkeleton({ count, variant }: { count: number; variant?: 'grid' | 'list' }) {
  const items = Array.from({ length: count })
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  )
}

function ArenaEmptyState({
  message,
  variant,
  onRetry,
}: {
  message: string
  variant?: 'empty'
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
        {variant === 'empty' ? '🌫️' : '⚠️'}
      </div>
      <p className="text-xs text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function BlockCard({ block }: { block: RelatedBlock }) {
  const title = typeof block.title === 'string' ? block.title : `Block ${block.id}`
  const imageUrl = typeof block.image_url === 'string' ? block.image_url : null

  return (
    <div className="flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      ) : (
        <span className="text-center text-[10px] text-gray-500 line-clamp-3">{title}</span>
      )}
    </div>
  )
}

// ─── ExampleRelatedBlocks ─────────────────────────────────────────────────────

const CANVAS_ID = 'preview-canvas'

export default function ExampleRelatedBlocks() {
  const { blocks, status, refresh } = useRelatedBlocks(CANVAS_ID, true)

  if (status === 'idle') {
    return (
      <div className="w-72 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <ArenaStatusMessage
          emoji="🔗"
          title="Discover related content"
          description="Click this tab to find Are.na blocks related to your canvas."
        />
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <ArenaSkeleton count={18} variant="grid" />
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="w-72 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <ArenaEmptyState message="Add more images to see related content" variant="empty" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-72 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <ArenaEmptyState message="Couldn't load related content" onRetry={refresh} />
      </div>
    )
  }

  if (status === 'rate_limited') {
    return (
      <div className="w-72 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <ArenaStatusMessage
          emoji="⏱️"
          title="Are.na rate limit reached"
          description="Suggestions will refresh once your limit resets."
        />
      </div>
    )
  }

  return (
    <div className="w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {blocks.map((block: any) => (
          <BlockCard key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}
