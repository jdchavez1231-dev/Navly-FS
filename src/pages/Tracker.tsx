import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useTracker } from '../hooks/useTracker'
import { useFacility } from '../hooks/useFacility'
import { BRCGS_SECTIONS, getSectionStats } from '../data/brcgs'
import { StatusSelect } from '../components/StatusBadge'
import { RatingBadge } from '../components/RatingBadge'
import { ClausePanel } from '../components/ClausePanel'
import type { Status, EvidenceItem } from '../types'

export default function Tracker() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const { data, updateClause, loading } = useTracker()
  const { facilityId } = useFacility()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const activeSectionId = sectionId ?? '1'
  const activeSection = BRCGS_SECTIONS.find(s => s.id === activeSectionId)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading checklist…
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Section sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sections</div>
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
              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                isActive
                  ? 'bg-blue-50 border-l-2 border-l-blue-600'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-xs font-medium leading-tight ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                  {section.id}. {section.title}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{s.compliant}/{s.total}</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-400' : 'bg-gray-200'
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
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeSection ? (
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Section {activeSection.id}: {activeSection.title}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{activeSection.clauses.length} requirements</p>
            </div>

            <div className="space-y-2">
              {activeSection.clauses.map(clause => {
                const record = data[clause.id]
                const status = (record?.status ?? 'not_assessed') as Status
                const isExpanded = expandedId === clause.id

                return (
                  <div
                    key={clause.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : clause.id)}
                    >
                      <span className="text-xs font-mono font-semibold text-gray-400 w-7 shrink-0">
                        {clause.id}
                      </span>
                      <RatingBadge rating={clause.rating} />
                      <span className="flex-1 text-sm font-medium text-gray-900 min-w-0">
                        {clause.title}
                      </span>
                      <StatusSelect
                        value={status}
                        onChange={s => updateClause(clause.id, { status: s })}
                      />
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {isExpanded && (
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
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a section to begin.
          </div>
        )}
      </div>
    </div>
  )
}
