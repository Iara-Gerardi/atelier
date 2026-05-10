export interface UseRateLimitResult {
  resetAt: number | null
  isExhausted: boolean
}
