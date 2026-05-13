import type { StateKey } from '@/.atelier/registry/types'

function toLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface StateBarProps {
  states: StateKey[]
  activeState: StateKey
  onChange: (state: StateKey) => void
}

export default function StateBar({ states, activeState, onChange }: StateBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      {states.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeState === key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
        >
          {toLabel(key)}
        </button>
      ))}
    </div>
  )
}
