'use client'

import { useState } from 'react'
import { useArenaSearch } from '../../hooks/useArenaSearch'
import { useRateLimit } from '../../hooks/useRateLimit'
import { SearchInput } from './components/SearchInput'
import { SearchResults } from './components/SearchResults'
import { ArenaEmptyState } from './components/ArenaEmptyState'

export default function ExampleSearchTab({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const { blocks, channels, isLoading, loadMore, hasMore, error, retry } = useArenaSearch(query)
  const { resetAt, isExhausted } = useRateLimit()

  const showError = !!query && !!error && !isLoading

  return (
    <div className="flex w-80 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <SearchInput value={query} onChange={setQuery} />
      {showError ? (
        <ArenaEmptyState message="Search failed — check your connection" onRetry={retry} />
      ) : (
        <SearchResults
          blocks={blocks}
          channels={channels}
          query={query}
          isLoading={isLoading}
        />
      )}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoading || isExhausted}
          title={
            isExhausted && resetAt
              ? `Resets at ${new Date(resetAt * 1000).toLocaleTimeString()}`
              : undefined
          }
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
