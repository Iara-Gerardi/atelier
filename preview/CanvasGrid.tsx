import type { RegistryEntry } from '@/registry/types'

interface CanvasGridProps {
  entries: RegistryEntry[]
}

const SUCCESS_FALLBACK = 'success'

export default function CanvasGrid({ entries }: CanvasGridProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        No components match the current filters.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-8">
        {entries.map((entry) => {
          const stateKey = entry.states[SUCCESS_FALLBACK]
            ? SUCCESS_FALLBACK
            : Object.keys(entry.states)[0]
          const { render } = entry.states[stateKey]

          return (
            <div key={entry.name} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-gray-800">{entry.name}</span>
                <span className="text-[10px] text-gray-400">{entry.category}</span>
              </div>
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6">
                {render()}
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
