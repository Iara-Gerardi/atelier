export interface Product {
  id: string
  name: string
  price: number
}

export type GetProductsResult = Product[]

export class GetProductsError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'GetProductsError'
  }
}
