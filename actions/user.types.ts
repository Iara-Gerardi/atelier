export interface GetUserProfileParams {
  userId: string
}

export interface GetUserProfileResult {
  id: string
  name: string
  email: string
  role: 'admin' | 'viewer'
}

export class GetUserProfileError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'GetUserProfileError'
  }
}
