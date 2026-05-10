import type { UseRateLimitResult } from '../../../hooks/useRateLimit.types'

export type { UseRateLimitResult }

type UseRateLimitFn = () => UseRateLimitResult

let _impl: UseRateLimitFn = () => ({
  resetAt: null,
  isExhausted: false,
})

export function setUseRateLimit(impl: UseRateLimitFn): void {
  _impl = impl
}

export function useRateLimit(): UseRateLimitResult {
  return _impl()
}
