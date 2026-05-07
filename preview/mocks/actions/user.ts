import type { GetUserProfileParams, GetUserProfileResult } from '@/actions/user.types'

type GetUserProfileFn = (params: GetUserProfileParams) => Promise<GetUserProfileResult>

let _impl: GetUserProfileFn = () => {
  throw new Error('getUserProfile mock not configured — call setGetUserProfile() first')
}

export function setGetUserProfile(impl: GetUserProfileFn): void {
  _impl = impl
}

export async function getUserProfile(params: GetUserProfileParams): Promise<GetUserProfileResult> {
  return _impl(params)
}
