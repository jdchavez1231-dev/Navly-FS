import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, MinusCircle, CalendarDays, Download, Loader2 } from 'lucide-react'
import { useTracker } from '../hooks/useTracker'
import { useFacility } from '../hooks/useFacility'
import { useCorrectiveActions } from '../hooks/useCorrectiveActions'
import { generateReadinessReport } from '../lib/reportGenerator'
import { BRCGS_SECTIONS, getAllStats, getSectionStats } from '../data/brcgs'

export default function Dashboard() {
  const { data, loading } = useTracker()
  const { facility } = useFacility()
  const { stats: caStats, actions } = useCorrectiveActions()
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)

  async function handleExportReport() {
    if (!facility) return
    setExporting(true)
    try {
      await generateReadinessReport(data, actions, facility)
    } finally {
      setExporting(false)
    }
  }

  const daysToAudit = facility?.audit_date
    ? Math.ceil((new Date(facility.audit_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  useEffect(() => { document.title = 'Dashboard — Navly FS' }, [])

  if (loading) {
    return (
      <div role="status" className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div aria-hidden="true" className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">BRCGS Food Safety — Issue 9 audit readiness</p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={exporting || loading}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Generating…' : 'Download Report'}
          </button>
        </div>

        {/* Score + stat cards */}
        <div className={`grid gap-4 mb-8 grid-cols-2 ${daysToAudit !== null && daysToAudit >= 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
          <div className="col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{score}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Compliance score</div>
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center col-span-1">
              <CalendarDays className="w-5 h-5 text-blue-400 mb-1" />
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{daysToAudit}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Days to audit</div>
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
          <div className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Corrective Actions</h2>
              <button onClick={() => navigate('/corrective-actions')} className="text-xs text-blue-600 hover:underline">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Section breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {BRCGS_SECTIONS.map(section => {
              const s = getSectionStats(section, data)
              const pct = s.assessed > 0 ? Math.round((s.compliant / s.assessed) * 100) : 0
              return (
                <button
                  key={section.id}
                  onClick={() => navigate(`/tracker/${section.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{section.id}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{section.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.gaps > 0 && (
                      <span className="text-xs text-red-600 font-medium">{s.gaps} gap{s.gaps !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-xs text-gray-400">{s.compliant}/{s.total}</span>
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${section.title}: ${s.assessed > 0 ? `${pct}% compliant` : 'not assessed'}`}
                      className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{s.assessed > 0 ? `${pct}%` : '—'}</span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">No clauses assessed yet.</p>
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{value}</div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(pct)}%`}
        className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">of {total} clauses</div>
    </div>
  )
}
