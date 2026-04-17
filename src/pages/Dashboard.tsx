import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, MinusCircle, CalendarDays } from 'lucide-react'
import { useTracker } from '../hooks/useTracker'
import { useFacility } from '../hooks/useFacility'
import { useCorrectiveActions } from '../hooks/useCorrectiveActions'
import { BRCGS_SECTIONS, getAllStats, getSectionStats } from '../data/brcgs'

export default function Dashboard() {
  const { data, loading } = useTracker()
  const { facility } = useFacility()
  const { stats: caStats, actions } = useCorrectiveActions()
  const navigate = useNavigate()

  const daysToAudit = facility?.audit_date
    ? Math.ceil((new Date(facility.audit_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading…
      </div>
    )
  }
  const stats = getAllStats(data)

  const score =
    stats.assessed > 0 ? Math.round((stats.compliant / stats.assessed) * 100) : 0

  const fundamentalGaps = BRCGS_SECTIONS.flatMap(s =>
    s.clauses.filter(c => c.rating === 'fundamental' && data[c.id]?.status === 'gap')
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">BRCGS Food Safety — Issue 9 audit readiness</p>
        </div>

        {/* Score + stat cards */}
        <div className={`grid gap-4 mb-8 ${daysToAudit !== null && daysToAudit >= 0 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900">{score}%</div>
            <div className="text-xs text-gray-500 mt-1 text-center">Compliance score</div>
            <div className="text-xs text-gray-400 mt-0.5">of assessed clauses</div>
          </div>

          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            label="Compliant"
            value={stats.compliant}
            total={stats.total}
            color="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            label="Gaps"
            value={stats.gaps}
            total={stats.total}
            color="red"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label="Not Assessed"
            value={stats.notAssessed}
            total={stats.total}
            color="amber"
          />
          {daysToAudit !== null && daysToAudit >= 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center col-span-1">
              <CalendarDays className="w-5 h-5 text-blue-400 mb-1" />
              <div className="text-2xl font-semibold text-gray-900">{daysToAudit}</div>
              <div className="text-xs text-gray-500 mt-0.5">Days to audit</div>
            </div>
          )}
        </div>

        {/* Critical gaps alert */}
        {fundamentalGaps.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                {fundamentalGaps.length} Fundamental clause{fundamentalGaps.length !== 1 ? 's' : ''} with gaps
              </span>
            </div>
            <p className="text-xs text-red-600 mb-3">
              Fundamental non-conformances result in automatic audit failure. Address these first.
            </p>
            <div className="space-y-1">
              {fundamentalGaps.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/tracker/${c.id.split('.')[0]}`)}
                  className="flex items-center gap-2 text-xs text-red-700 hover:text-red-900 hover:underline"
                >
                  <span className="font-mono font-semibold">{c.id}</span>
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Corrective actions summary */}
        {actions.length > 0 && (
          <div className="mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Corrective Actions</h2>
              <button onClick={() => navigate('/corrective-actions')} className="text-xs text-blue-600 hover:underline">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              {[
                { label: 'Open', value: caStats.open, color: 'text-red-600' },
                { label: 'In Progress', value: caStats.in_progress, color: 'text-amber-600' },
                { label: 'Overdue', value: caStats.overdue, color: caStats.overdue > 0 ? 'text-red-700 font-bold' : 'text-gray-400' },
                { label: 'Closed', value: caStats.closed, color: 'text-green-600' },
              ].map(item => (
                <div key={item.label} className="px-5 py-4 text-center">
                  <div className={`text-2xl font-semibold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Section breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {BRCGS_SECTIONS.map(section => {
              const s = getSectionStats(section, data)
              const pct = s.assessed > 0 ? Math.round((s.compliant / s.assessed) * 100) : 0
              return (
                <button
                  key={section.id}
                  onClick={() => navigate(`/tracker/${section.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{section.id}</span>
                  <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{section.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.gaps > 0 && (
                      <span className="text-xs text-red-600 font-medium">{s.gaps} gap{s.gaps !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-xs text-gray-400">{s.compliant}/{s.total}</span>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{s.assessed > 0 ? `${pct}%` : '—'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state nudge */}
        {stats.assessed === 0 && (
          <div className="mt-6 text-center">
            <MinusCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No clauses assessed yet.</p>
            <button
              onClick={() => navigate('/tracker/1')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Start with Section 1 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total: number
  color: 'green' | 'red' | 'amber'
}) {
  const barColor = { green: 'bg-green-500', red: 'bg-red-400', amber: 'bg-amber-400' }[color]
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-2">{value}</div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">of {total} clauses</div>
    </div>
  )
}
