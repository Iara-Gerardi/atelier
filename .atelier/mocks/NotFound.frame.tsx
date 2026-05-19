import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'NotFound',
  category: 'Pages',
  tags: ['error', '404'],
}

function NotFoundCard() {
  return (
    <div className="w-80 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400">
        404
      </div>
      <p className="font-semibold text-gray-800">Not found</p>
      <p className="mt-1 text-sm text-gray-500">
        The page you tried to open doesn't exist, or you don't have access to it.
      </p>
    </div>
  )
}

const states: Record<StateKey, ComponentState> = {
  default: {
    description: 'Generic 404 card — rendered as the fallback when a scene gate fails.',
    render: () => <NotFoundCard />,
  },
}

export default states
