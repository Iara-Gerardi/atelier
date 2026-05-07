import type { StateKey } from '@/registry/types'

const STATES: { key: StateKey; label: string }[] = [
  { key: 'loading', label: 'Loading' },
  { key: 'error', label: 'Error' },
  { key: 'success', label: 'Success' },
]

interface StateBarProps {
  activeState: StateKey
  onChange: (state: StateKey) => void
}

export default function StateBar({ activeState, onChange }: StateBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      {STATES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeState === key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
