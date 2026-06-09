interface Props {
  rows?: number
  className?: string
}

function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded-lg`} />
}

export default function SkeletonCard({ rows = 3, className = '' }: Props) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <SkeletonLine width="w-1/3" height="h-3" />
      <SkeletonLine width="w-1/2" height="h-7" />
      {Array.from({ length: rows - 2 }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl p-5 overflow-hidden skeleton" style={{ minHeight: '120px' }}>
      <div className="skeleton w-10 h-10 rounded-xl mb-3" />
      <div className="skeleton w-16 h-3 rounded mb-2" />
      <div className="skeleton w-12 h-8 rounded" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Two cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard rows={5} />
        <SkeletonCard rows={5} />
      </div>
    </div>
  )
}
