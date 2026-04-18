import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Filter } from 'lucide-react'
import { useCorrectiveActions } from '../hooks/useCorrectiveActions'
import { FullCAPAModal } from '../components/FullCAPAModal'
import type { CorrectiveAction, CAStatus } from '../types'

const STATUS_CONFIG: Record<CAStatus, { label: string; dot: string }> = {
  open:        { label: 'Open',        dot: 'bg-red-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500' },
  closed:      { label: 'Closed',      dot: 'bg-blue-500' },
  verified:    { label: 'Verified',    dot: 'bg-green-500' },
}

const SEVERITY_COLOR: Record<string, string> = {
  fundamental: 'text-red-600 bg-red-50 border-red-200',
  major:       'text-orange-600 bg-orange-50 border-orange-200',
  minor:       'text-yellow-700 bg-yellow-50 border-yellow-200',
}

type FilterStatus = CAStatus | 'all'

export default function CorrectiveActions() {
  const { actions, loading, updateAction, stats } = useCorrectiveActions()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedCA, setSelectedCA] = useState<CorrectiveAction | null>(null)

  const filtered = filterStatus === 'all'
    ? actions
    : actions.filter(a => a.status === filterStatus)

  useEffect(() => { document.title = 'Corrective Actions — Navly FS' }, [])

  if (loading) {
    return (
      <div role="status" className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div aria-hidden="true" className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Corrective Actions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage non-conformances to closure</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Open" value={stats.open} icon={<AlertTriangle className="w-4 h-4 text-red-500" />} color="red" />
          <SummaryCard label="In Progress" value={stats.in_progress} icon={<Clock className="w-4 h-4 text-amber-500" />} color="amber" />
          <SummaryCard label="Overdue" value={stats.overdue} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} color="red" highlight />
          <SummaryCard label="Closed / Verified" value={stats.closed} icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} color="green" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'open', 'in_progress', 'closed', 'verified'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              aria-pressed={filterStatus === s}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {filterStatus === 'all' ? 'No corrective actions yet — they\'re auto-created when gaps are identified.' : `No ${filterStatus.replace('_', ' ')} actions.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Clause</th>
                  <th className="text-left px-5 py-3 font-medium">Severity</th>
                  <th className="text-left px-5 py-3 font-medium">Assigned to</th>
                  <th className="text-left px-5 py-3 font-medium">Due date</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map(ca => {
                  const isOverdue = ca.due_date && new Date(ca.due_date) < new Date() && ca.status !== 'closed' && ca.status !== 'verified'
                  const statusCfg = STATUS_CONFIG[ca.status]
                  return (
                    <tr key={ca.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs text-gray-400 mb-0.5">{ca.element_code}</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{ca.element_name}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${SEVERITY_COLOR[ca.severity]}`}>
                          {ca.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {ca.assigned_to || <span className="text-gray-300 italic">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {ca.due_date ? (
                          <span className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                            {new Date(ca.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm italic">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{statusCfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedCA(ca)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Open CAPA
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCA && (
        <FullCAPAModal
          action={selectedCA}
          onUpdate={(id, patch) => {
            updateAction(id, patch)
            setSelectedCA(prev => prev ? { ...prev, ...patch } : null)
          }}
          onClose={() => setSelectedCA(null)}
        />
      )}
    </div>
  )
}

function SummaryCard({
  label, value, icon, highlight
}: {
  label: string; value: number; icon: React.ReactNode; color?: 'red' | 'amber' | 'green'; highlight?: boolean
}) {
  const border = highlight && value > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  return (
    <div className={`border rounded-xl p-4 ${border}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500 dark:text-gray-400">{label}</span></div>
      <div className={`text-2xl font-bold ${highlight && value > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    </div>
  )
}
