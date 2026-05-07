import { use, useMemo, Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { getUserProfile } from '@/actions/user'
import type { GetUserProfileResult } from '@/actions/user.types'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="w-72 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-4 h-3 w-20 animate-pulse rounded bg-gray-200" />
    </div>
  )
}

// ─── Error fallback ───────────────────────────────────────────────────────────

function CardError({ error }: FallbackProps) {
  return (
    <div className="w-72 rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm font-medium text-red-700">Failed to load user</p>
      <p className="mt-1 text-xs text-red-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  )
}

// ─── Presentation ─────────────────────────────────────────────────────────────

function UserCard({ promise }: { promise: Promise<GetUserProfileResult> }) {
  const user = use(promise)

  return (
    <div className="w-72 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
          {user.name[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="mt-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          user.role === 'admin'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {user.role}
        </span>
      </div>
    </div>
  )
}

// ─── Data layer ───────────────────────────────────────────────────────────────

function ExampleCardInner() {
  const promise = useMemo(() => getUserProfile({ userId: 'current' }), [])
  return <UserCard promise={promise} />
}

// ─── Public export (with boundaries) ─────────────────────────────────────────

export default function ExampleCard() {
  return (
    <ErrorBoundary FallbackComponent={CardError}>
      <Suspense fallback={<CardSkeleton />}>
        <ExampleCardInner />
      </Suspense>
    </ErrorBoundary>
  )
}

