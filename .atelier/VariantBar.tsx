import { variantAxes, type VariantKey, type VariantValues } from './variants'

interface VariantBarProps {
  /** Axes to render. The bar renders nothing when this is empty. */
  keys: readonly VariantKey[]
  values: VariantValues
  onChange: (next: VariantValues) => void
}

export default function VariantBar({ keys, values, onChange }: VariantBarProps) {
  if (keys.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Variants
      </span>
      {keys.map((key) => {
        const axis = variantAxes[key]
        return (
          <label key={key} className="flex items-center gap-1.5 text-xs">
            <span
              className="font-medium text-indigo-700"
              title={axis.description}
            >
              {axis.label}
            </span>
            <select
              value={values[key]}
              onChange={(e) =>
                onChange({ ...values, [key]: e.target.value as VariantValues[typeof key] })
              }
              className="rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs text-indigo-800"
            >
              {axis.values.map((v) => (
                <option key={v.value} value={v.value} title={v.description}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )
      })}
    </div>
  )
}
