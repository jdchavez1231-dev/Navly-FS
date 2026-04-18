import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useTracker } from '../hooks/useTracker'
import { useCorrectiveActions } from '../hooks/useCorrectiveActions'
import { useFacility } from '../hooks/useFacility'
import { BRCGS_SECTIONS, getSectionStats } from '../data/brcgs'
import { StatusSelect } from '../components/StatusBadge'
import { RatingBadge } from '../components/RatingBadge'
import { ClausePanel } from '../components/ClausePanel'
import type { Status, EvidenceItem, Rating } from '../types'

export default function Tracker() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const { facilityId } = useFacility()

  const { createAction, updateAction, getByClause } = useCorrectiveActions()

  const onGapDetected = useCallback((params: {
    checklistId: string
    elementCode: string
    elementName: string
    severity: Rating
    description?: string
  }) => {
    createAction(params)
  }, [createAction])

  const { data, updateClause, loading } = useTracker(onGapDetected)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const activeSectionId = sectionId ?? '1'
  const activeSection = BRCGS_SECTIONS.find(s => s.id === activeSectionId)

  useEffect(() => { document.title = 'BRCGS Tracker — Navly FS' }, [])

  if (loading) {
    return (
      <div role="status" className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        <div aria-hidden="true" className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading checklist…
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Section sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sections</div>
        </div>
        {BRCGS_SECTIONS.map(section => {
          const s = getSectionStats(section, data)
          const isActive = section.id === activeSectionId
          const pct = s.assessed > 0 ? Math.round((s.compliant / s.assessed) * 100) : 0

          return (
            <button
              key={section.id}
              onClick={() => {
                navigate(`/tracker/${section.id}`)
                setExpandedId(null)
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-xs font-medium leading-tight ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {section.id}. {section.title}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{s.compliant}/{s.total}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.title}: ${s.assessed > 0 ? `${pct}% compliant` : 'not assessed'}`}
                className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ width: `${Math.max(pct, s.assessed > 0 ? 2 : 0)}%` }}
                />
              </div>
              {s.gaps > 0 && (
                <div className="mt-1 text-xs text-red-500">{s.gaps} gap{s.gaps !== 1 ? 's' : ''}</div>
              )}
            </button>
          )
        })}
      </aside>

      {/* Clause list */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {activeSection ? (
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Section {activeSection.id}: {activeSection.title}
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{activeSection.clauses.length} requirements</p>
            </div>

            <div className="space-y-2">
              {activeSection.clauses.map(clause => {
                const record = data[clause.id]
                const status = (record?.status ?? 'not_assessed') as Status
                const isExpanded = expandedId === clause.id
                const ca = getByClause(clause.id)

                return (
                  <div
                    key={clause.id}
                    className={`bg-white dark:bg-gray-800 border rounded-lg overflow-hidden ${
                      status === 'gap' ? 'border-orange-200 dark:border-orange-800' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`clause-panel-${clause.id}`}
                        onClick={() => setExpandedId(isExpanded ? null : clause.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <span className="text-xs font-mono font-semibold text-gray-400 dark:text-gray-500 w-7 shrink-0">
                          {clause.id}
                        </span>
                        <RatingBadge rating={clause.rating} />
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white min-w-0">
                          {clause.title}
                        </span>
                        {ca && !isExpanded && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium shrink-0">CA {ca.status.replace('_', ' ')}</span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <StatusSelect
                        value={status}
                        onChange={s => {
                          updateClause(clause.id, { status: s })
                          if (s === 'gap') setExpandedId(clause.id)
                        }}
                      />
                    </div>

                    {isExpanded && (
                      <div id={`clause-panel-${clause.id}`}>
                      <ClausePanel
                        clause={clause}
                        record={record ?? { status: 'not_assessed', notes: '', updatedAt: '', evidence: [] }}
                        facilityId={facilityId ?? ''}
                        onUpdateNotes={notes => updateClause(clause.id, { notes })}
                        onAddEvidence={(item: EvidenceItem) =>
                          updateClause(clause.id, { evidence: [...(record?.evidence ?? []), item] })
                        }
                        onRemoveEvidence={(url: string) =>
                          updateClause(clause.id, {
                            evidence: (record?.evidence ?? []).filter(e => e.url !== url),
                          })
                        }
                        correctiveAction={ca}
                        onUpdateCA={updateAction}
                      />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            Select a section to begin.
          </div>
        )}
      </div>
    </div>
  )
}
