'use server'

import {
  GetUserProfileError,
  type GetUserProfileParams,
  type GetUserProfileResult,
} from './user.types'

export async function getUserProfile(
  params: GetUserProfileParams,
): Promise<GetUserProfileResult> {
  // Real implementation: fetch from your database / API
  void params
  throw new GetUserProfileError('Not implemented')
}
