import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import type { CorrectiveAction } from '../types'

interface Props {
  action: CorrectiveAction
  onUpdate: (id: string, patch: Partial<CorrectiveAction>) => void
  onClose: () => void
}

const SEVERITY_BADGE: Record<string, string> = {
  fundamental: 'bg-red-100 text-red-700 border-red-200',
  major:       'bg-orange-100 text-orange-700 border-orange-200',
  minor:       'bg-yellow-100 text-yellow-700 border-yellow-200',
}

type Draft = Partial<CorrectiveAction>

export function FullCAPAModal({ action, onUpdate, onClose }: Props) {
  const [draft, setDraft] = useState<Draft>({
    assigned_to:         action.assigned_to,
    due_date:            action.due_date,
    status:              action.status,
    description:         action.description,
    immediate_action:    action.immediate_action,
    root_cause:          action.root_cause,
    corrective_action:   action.corrective_action,
    preventive_action:   action.preventive_action,
    verification_method: action.verification_method,
    verified_by:         action.verified_by,
  })

  function set(field: keyof Draft, value: string) {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  function save() {
    onUpdate(action.id, draft)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900">Corrective Action — Full CAPA</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">{action.element_code}</span>
              <span className="text-xs text-gray-500">{action.element_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${SEVERITY_BADGE[action.severity]}`}>
                {action.severity}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Quick fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned to</label>
              <input
                type="text"
                value={draft.assigned_to ?? ''}
                onChange={e => set('assigned_to', e.target.value)}
                placeholder="Name or team"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due date</label>
              <input
                type="date"
                value={draft.due_date ?? ''}
                onChange={e => set('due_date', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={draft.status ?? 'open'}
                onChange={e => set('status', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>

          <Field label="Non-conformance description" value={draft.description ?? ''} onChange={v => set('description', v)}
            placeholder="Describe what was found during the audit…" />

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">CAPA Details</p>
            <div className="space-y-4">
              <Field label="Immediate containment action" value={draft.immediate_action ?? ''} onChange={v => set('immediate_action', v)}
                placeholder="What was done immediately to contain the issue?" />
              <Field label="Root cause analysis" value={draft.root_cause ?? ''} onChange={v => set('root_cause', v)}
                placeholder="Why did this non-conformance occur? (5 Whys, fishbone, etc.)" rows={4} />
              <Field label="Corrective action" value={draft.corrective_action ?? ''} onChange={v => set('corrective_action', v)}
                placeholder="What action will be taken to correct the identified issue?" rows={3} />
              <Field label="Preventive action" value={draft.preventive_action ?? ''} onChange={v => set('preventive_action', v)}
                placeholder="What will be done to prevent recurrence?" rows={3} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Verification</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Verification method" value={draft.verification_method ?? ''} onChange={v => set('verification_method', v)}
                placeholder="How will effectiveness be verified?" />
              <Field label="Verified by" value={draft.verified_by ?? ''} onChange={v => set('verified_by', v)}
                placeholder="Name of verifier" />
            </div>
          </div>

          <div className="text-xs text-gray-400 pt-1">
            Identified: {new Date(action.identified_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Save CAPA
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, rows = 2
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
      />
    </div>
  )
}
