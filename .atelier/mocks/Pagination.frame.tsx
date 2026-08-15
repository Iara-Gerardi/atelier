import { useState } from 'react'
import { Pagination } from '@/components/ui/Pagination'
import type { StateKey, ComponentState, MockMeta } from '@/.atelier/registry/types'

export const meta: MockMeta = {
  name: 'Pagination',
  category: 'UI',
  tags: ['ui', 'navigation'],
}

function InteractivePagination({ initialPage, totalPages }: { initialPage: number; totalPages: number }) {
  const [page, setPage] = useState(initialPage)
  return (
    <div className="w-80">
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}

const states: Record<StateKey, ComponentState> = {
  first_page: {
    description: 'On the first page — the Prev button is disabled',
    render: () => <InteractivePagination key="first_page" initialPage={1} totalPages={5} />,
  },
  middle_page: {
    description: 'A middle page — both controls are enabled',
    render: () => <InteractivePagination key="middle_page" initialPage={3} totalPages={5} />,
  },
  last_page: {
    description: 'On the last page — the Next button is disabled',
    render: () => <InteractivePagination key="last_page" initialPage={5} totalPages={5} />,
  },
  single_page: {
    description: 'Only one page — both controls are disabled',
    render: () => <InteractivePagination key="single_page" initialPage={1} totalPages={1} />,
  },
}

export default states
