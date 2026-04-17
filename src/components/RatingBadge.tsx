import type { Rating } from '../types'

const CONFIG: Record<Rating, { label: string; className: string }> = {
  fundamental: { label: '★ Fundamental', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  major:       { label: 'Major',         className: 'bg-orange-50 text-orange-600 border-orange-200' },
  minor:       { label: 'Minor',         className: 'bg-blue-50 text-blue-600 border-blue-200' },
}

export function RatingBadge({ rating }: { rating: Rating }) {
  const { label, className } = CONFIG[rating]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border shrink-0 ${className}`}>
      {label}
    </span>
  )
}
