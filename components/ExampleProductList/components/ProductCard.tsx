import type { Product } from '@/actions/product.types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="unit flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="unit text-sm font-medium text-gray-900">{product.name}</span>
      <span className="unit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        ${product.price.toFixed(2)}
      </span>
    </div>
  )
}
