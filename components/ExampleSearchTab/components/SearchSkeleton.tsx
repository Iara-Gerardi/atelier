export function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  )
}
