interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'viewer'
}

interface ExampleCardProps {
  isLoading: boolean
  error?: string
  user?: User
}

export default function ExampleCard({ isLoading, error, user }: ExampleCardProps) {
  if (isLoading) {
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

  if (error) {
    return (
      <div className="w-72 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">Failed to load user</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    )
  }

  if (!user) return null

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
