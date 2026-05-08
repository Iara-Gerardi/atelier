'use server'

import { GetProductsError, type GetProductsResult } from './product.types'

export async function getProducts(): Promise<GetProductsResult> {
  throw new GetProductsError('Not implemented')
}
