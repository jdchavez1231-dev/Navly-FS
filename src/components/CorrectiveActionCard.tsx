import { useState } from 'react'
import { AlertTriangle, ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { FullCAPAModal } from './FullCAPAModal'
import type { CorrectiveAction, CAStatus } from '../types'

interface Props {
  action: CorrectiveAction
  onUpdate: (id: string, patch: Partial<CorrectiveAction>) => void
}

const STATUS_CONFIG: Record<CAStatus, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-red-50 text-red-700 border-red-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  closed:      { label: 'Closed',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified:    { label: 'Verified',    className: 'bg-green-50 text-green-700 border-green-200' },
}

const SEVERITY_COLOR: Record<string, string> = {
  fundamental: 'text-red-600',
  major: 'text-orange-500',
  minor: 'text-yellow-600',
}

export function CorrectiveActionCard({ action, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false)
  const status = STATUS_CONFIG[action.status]
  const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== 'closed' && action.status !== 'verified'

  return (
    <>
      <div className="mt-3 border border-orange-200 bg-orange-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700">Corrective Action</span>
            <span className={`text-xs capitalize font-medium ${SEVERITY_COLOR[action.severity]}`}>
              · {action.severity}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Assigned to</label>
            <input
              type="text"
              value={action.assigned_to}
              onChange={e => onUpdate(action.id, { assigned_to: e.target.value })}
              placeholder="Name or team"
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Due date {isOverdue && <span className="text-red-500 font-medium">· Overdue</span>}
            </label>
            <input
              type="date"
              value={action.due_date ?? ''}
              onChange={e => onUpdate(action.id, { due_date: e.target.value || null })}
              className={`w-full text-xs border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${isOverdue ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={action.status}
            onChange={e => onUpdate(action.id, { status: e.target.value as CAStatus })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
            <option value="verified">Verified</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {action.immediate_action ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Immediate action</span> : null}
            {action.root_cause ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />Root cause</span> : null}
            {!action.immediate_action && !action.root_cause && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Full CAPA pending</span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Full CAPA
          </button>
        </div>
      </div>

      {showModal && (
        <FullCAPAModal
          action={action}
          onUpdate={onUpdate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
