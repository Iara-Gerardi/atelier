import type { RegistryEntry, StateKey } from '@/.atelier/registry/types'
import type { VariantKey, VariantValues } from './variants'

interface ComponentCanvasProps {
  entry: RegistryEntry
  activeState: StateKey
  variants: VariantValues
}

export default function ComponentCanvas({ entry, activeState, variants }: ComponentCanvasProps) {
  const state = entry.states[activeState] ?? entry.states[Object.keys(entry.states)[0]]
  const { render, description } = state
  const variantKeys = (entry.variants ?? []) as readonly VariantKey[]
  const visibleVariants = Object.fromEntries(
    variantKeys.map((k) => [k, variants[k]]),
  ) as Partial<VariantValues>
  const renderKey = `${entry.name}:${activeState}:${variantKeys
    .map((k) => `${k}=${variants[k]}`)
    .join(',')}`

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {description && (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs text-gray-400">
          {description}
        </div>
      )}
      <div key={renderKey} className="flex flex-1 items-center justify-center bg-white p-10">
        {render({ variants: visibleVariants })}
      </div>
    </div>
  )
}
