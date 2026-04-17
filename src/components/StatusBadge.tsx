import type { Status } from '../types'

const CONFIG: Record<Status, { label: string; className: string }> = {
  not_assessed: { label: 'Not Assessed', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  compliant:    { label: 'Compliant',    className: 'bg-green-50 text-green-700 border-green-200' },
  gap:          { label: 'Gap',          className: 'bg-red-50 text-red-700 border-red-200' },
  na:           { label: 'N/A',          className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: Status
  onChange: (s: Status) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Status)}
      onClick={e => e.stopPropagation()}
      className={`text-xs font-medium border rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${CONFIG[value].className}`}
    >
      <option value="not_assessed">Not Assessed</option>
      <option value="compliant">Compliant</option>
      <option value="gap">Gap</option>
      <option value="na">N/A</option>
    </select>
  )
}
