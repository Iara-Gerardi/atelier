import { useState } from 'react'
import type { RegistryEntry, StateKey } from '@/registry/types'
import { registry } from './registry'
import StateBar from './StateBar'
import ComponentCanvas from './ComponentCanvas'

function groupByCategory(entries: RegistryEntry[]): Record<string, RegistryEntry[]> {
  return entries.reduce<Record<string, RegistryEntry[]>>((acc, entry) => {
    const group = acc[entry.category] ?? []
    return { ...acc, [entry.category]: [...group, entry] }
  }, {})
}

export default function PreviewShell() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeState, setActiveState] = useState<StateKey>('success')

  const activeEntry = registry[activeIndex]
  const groups = groupByCategory(registry)

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
              const isActive = idx === activeIndex
              return (
                <button
                  key={entry.name}
                  onClick={() => {
                    setActiveIndex(idx)
                    setActiveState('success')
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    isActive
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
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="font-medium text-gray-800">{activeEntry.name}</span>
        </div>
        <StateBar activeState={activeState} onChange={setActiveState} />
        <ComponentCanvas entry={activeEntry} activeState={activeState} />
      </div>
    </div>
  )
}
