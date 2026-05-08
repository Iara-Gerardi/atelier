'use client'

import { useState, useEffect } from 'react'
import { getProducts } from '@/actions/product'
import { GetProductsError, type Product } from '@/actions/product.types'
import { ProductCard } from './components/ProductCard'
import { Pagination } from './components/Pagination'

const PAGE_SIZE = 3

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
