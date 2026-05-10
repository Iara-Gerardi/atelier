import type { ReactNode } from 'react'

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>
}
