import type { RegistryEntry, StateKey } from '@/registry/types'

interface ComponentCanvasProps {
  entry: RegistryEntry
  activeState: StateKey
}

export default function ComponentCanvas({ entry, activeState }: ComponentCanvasProps) {
  const state = entry.states[activeState] ?? entry.states[Object.keys(entry.states)[0]]
  const { render, description } = state

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {description && (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs text-gray-400">
          {description}
        </div>
      )}
      <div className="flex flex-1 items-center justify-center bg-white p-10">
        {render()}
      </div>
    </div>
  )
}
