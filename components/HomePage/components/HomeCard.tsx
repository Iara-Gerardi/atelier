import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/actions/product.types'

export function HomeCard({ product }: { product: Product }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-gray-900">{product.name}</span>
      <Badge>${product.price.toFixed(2)}</Badge>
    </div>
  )
}
