import type { GetProductsResult } from '@/actions/product.types'

type GetProductsFn = () => Promise<GetProductsResult>

let _impl: GetProductsFn = () => {
  throw new Error('getProducts mock not configured — call setGetProducts() first')
}

export function setGetProducts(impl: GetProductsFn): void {
  _impl = impl
}

export async function getProducts(): Promise<GetProductsResult> {
  return _impl()
}
