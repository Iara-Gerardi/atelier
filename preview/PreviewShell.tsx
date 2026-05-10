import { useState } from 'react'
import type { RegistryEntry, StateKey } from '@/registry/types'
import { registry } from 'virtual:preview-registry'
import StateBar from './StateBar'
import ComponentCanvas from './ComponentCanvas'
import CanvasGrid from './CanvasGrid'

function groupByCategory(entries: RegistryEntry[]): Record<string, RegistryEntry[]> {
  return entries.reduce<Record<string, RegistryEntry[]>>((acc, entry) => {
    const group = acc[entry.category] ?? []
    return { ...acc, [entry.category]: [...group, entry] }
  }, {})
}

function allTags(entries: RegistryEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags ?? []))].sort()
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

function SingleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  )
}

export default function PreviewShell() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeState, setActiveState] = useState<StateKey>(() => Object.keys(registry[0].states)[0])
  const [mode, setMode] = useState<'single' | 'canvas'>('single')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const activeEntry = registry[activeIndex]
  const availableStates = Object.keys(activeEntry.states)
  const groups = groupByCategory(registry)
  const tags = allTags(registry)

  const filteredEntries = registry.filter((entry) => {
    const categoryMatch = activeCategories.size === 0 || activeCategories.has(entry.category)
    const tagMatch = activeTags.size === 0 || (entry.tags ?? []).some((t: string) => activeTags.has(t))
    return categoryMatch && tagMatch
  })

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans text-sm">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto bg-gray-900 py-4">
        <div className="mb-4 px-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Atelier
          </span>
        </div>

        {Object.entries(groups).map(([category, entries]) => (
          <div key={category} className="mb-4">
            <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {category}
            </p>
            {entries.map((entry) => {
              const idx = registry.indexOf(entry)
              const isActive = idx === activeIndex && mode === 'single'
              return (
                <button
                  key={entry.name}
                  onClick={() => {
                    setActiveIndex(idx)
                    setActiveState(Object.keys(registry[idx].states)[0])
                    setMode('single')
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${isActive
                      ? 'bg-gray-800 font-medium text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                >
                  {entry.name}
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="font-medium text-gray-800">
            {mode === 'single' ? activeEntry.name : 'Canvas'}
          </span>
          <button
            onClick={() => setMode((m) => m === 'single' ? 'canvas' : 'single')}
            title={mode === 'single' ? 'Open canvas view' : 'Back to single view'}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            {mode === 'single' ? <GridIcon /> : <SingleIcon />}
          </button>
        </div>

        {mode === 'single' ? (
          <>
            <StateBar states={availableStates} activeState={activeState} onChange={setActiveState} />
            <ComponentCanvas entry={activeEntry} activeState={activeState} />
          </>
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-6 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Category</span>
              {Object.keys(groups).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${activeCategories.has(cat)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
              {tags.length > 0 && (
                <>
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tag</span>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${activeTags.has(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </>
              )}
            </div>
            <CanvasGrid entries={filteredEntries} />
          </>
        )}
      </div>
    </div>
  )
}
