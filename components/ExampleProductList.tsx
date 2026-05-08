'use client'

import { useState, useEffect } from 'react'
import { getProducts } from '@/actions/product'
import { GetProductsError, type Product } from '@/actions/product.types'

const PAGE_SIZE = 3

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="unit flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="unit text-sm font-medium text-gray-900">{product.name}</span>
      <span className="unit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        ${product.price.toFixed(2)}
      </span>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-xs text-gray-400">
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  )
}

// ─── ExampleProductList ───────────────────────────────────────────────────────

export default function ExampleProductList() {
  const [data, setData] = useState<Product[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setData(null)
    setPage(1)
    getProducts()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error('Unknown error')))
      .finally(() => setIsLoading(false))
  }, [])

  if (error) {
    return (
      <div className="w-80 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">Failed to load products</p>
        <p className="mt-1 text-xs text-red-500">
          {error instanceof GetProductsError && error.code ? `[${error.code}] ` : ''}
          {error.message}
        </p>
      </div>
    )
  }

  const totalPages = data ? Math.ceil(data.length / PAGE_SIZE) : 1
  const pageItems: Product[] = data
    ? data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: String(i), name: '————————', price: 0 }))

  return (
    <div className={`flex w-80 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm${isLoading ? ' [&_.unit]:loading-item' : ''}`}>
      <h2 className="text-sm font-semibold text-gray-900">Products</h2>
      <div className="flex flex-col gap-2">
        {pageItems.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}
