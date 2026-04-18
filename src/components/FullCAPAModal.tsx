import { useEffect, useRef, useState } from 'react'
import { X, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import type { CorrectiveAction, RCAFramework, FiveWhysData, FishboneData } from '../types'

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

const RCA_OPTIONS: { value: RCAFramework; label: string; description: string }[] = [
  { value: 'narrative',  label: 'Narrative',          description: 'Free-form description of root cause' },
  { value: '5_whys',     label: '5 Whys',             description: 'Ask "Why?" five times to find root cause' },
  { value: 'fishbone',   label: 'Fishbone (Ishikawa)', description: 'Categorise causes across 6 dimensions' },
]

const EMPTY_5WHYS: FiveWhysData = { why1: '', why2: '', why3: '', why4: '', why5: '' }
const EMPTY_FISHBONE: FishboneData = { man: '', machine: '', method: '', material: '', environment: '', measurement: '' }

type Draft = Partial<CorrectiveAction>

export function FullCAPAModal({ action, onUpdate, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Restore focus to the trigger element when modal closes
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    return () => { prev?.focus() }
  }, [])

  // Focus trap and Escape key handler
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const [draft, setDraft] = useState<Draft>({
    assigned_to:         action.assigned_to,
    due_date:            action.due_date,
    status:              action.status,
    description:         action.description,
    rca_framework:       action.rca_framework ?? 'narrative',
    rca_data:            action.rca_data ?? {},
    immediate_action:    action.immediate_action,
    root_cause:          action.root_cause,
    corrective_action:   action.corrective_action,
    preventive_action:   action.preventive_action,
    verification_method: action.verification_method,
    verified_by:         action.verified_by,
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  const framework = draft.rca_framework ?? 'narrative'

  function set(field: keyof Draft, value: any) {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  function setRCAField(key: string, value: string) {
    setDraft(prev => ({
      ...prev,
      rca_data: { ...(prev.rca_data as any ?? {}), [key]: value },
    }))
  }

  function switchFramework(fw: RCAFramework) {
    set('rca_framework', fw)
    if (fw === '5_whys' && !('why1' in (draft.rca_data ?? {}))) {
      set('rca_data', EMPTY_5WHYS)
    } else if (fw === 'fishbone' && !('man' in (draft.rca_data ?? {}))) {
      set('rca_data', EMPTY_FISHBONE)
    }
  }

  async function generateWithAI() {
    setAiLoading(true)
    setAiApplied(false)

    const frameworkLabel = RCA_OPTIONS.find(o => o.value === framework)?.label ?? 'Narrative'

    const prompt = `You are a BRCGS Food Safety Issue 9 auditor helping complete a Corrective and Preventive Action (CAPA) record.

Non-conformance details:
- Clause: ${action.element_code} — ${action.element_name}
- Severity: ${action.severity}
- Finding/Description: ${draft.description || 'Not specified'}
- Root cause analysis framework: ${frameworkLabel}

Generate practical, specific CAPA entries for a food manufacturing facility. Return ONLY valid JSON with these fields:

${framework === '5_whys' ? `"rca_data": { "why1": "...", "why2": "...", "why3": "...", "why4": "...", "why5": "..." },` : ''}
${framework === 'fishbone' ? `"rca_data": { "man": "...", "machine": "...", "method": "...", "material": "...", "environment": "...", "measurement": "..." },` : ''}
${framework === 'narrative' ? `"root_cause": "...",` : ''}
"immediate_action": "...",
"corrective_action": "...",
"preventive_action": "...",
"verification_method": "..."

Be specific and practical. Each field should be 1-3 sentences. No extra text or markdown.`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const json = await res.json()
      const text = (json.content?.[0]?.text ?? '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const suggested = JSON.parse(text)

      setDraft(prev => ({
        ...prev,
        immediate_action:    suggested.immediate_action    ?? prev.immediate_action,
        corrective_action:   suggested.corrective_action   ?? prev.corrective_action,
        preventive_action:   suggested.preventive_action   ?? prev.preventive_action,
        verification_method: suggested.verification_method ?? prev.verification_method,
        ...(framework === 'narrative' && suggested.root_cause
          ? { root_cause: suggested.root_cause }
          : {}),
        ...(suggested.rca_data
          ? { rca_data: suggested.rca_data }
          : {}),
      }))
      setAiApplied(true)
    } catch {
      // fail silently — fields stay unchanged
    } finally {
      setAiLoading(false)
    }
  }

  function save() {
    onUpdate(action.id, draft)
    onClose()
  }

  const rcaData = (draft.rca_data ?? {}) as any

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="capa-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 id="capa-modal-title" className="text-base font-semibold text-gray-900">Full CAPA</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">{action.element_code}</span>
              <span className="text-xs text-gray-500 truncate max-w-xs">{action.element_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${SEVERITY_BADGE[action.severity]}`}>
                {action.severity}
              </span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 mt-1">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Quick fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned to</label>
              <input type="text" value={draft.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value)}
                placeholder="Name or team"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due date</label>
              <input type="date" value={draft.due_date ?? ''} onChange={e => set('due_date', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={draft.status ?? 'open'} onChange={e => set('status', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>

          <TextField label="Non-conformance description" value={draft.description ?? ''} onChange={v => set('description', v)}
            placeholder="Describe what was observed during the audit…" />

          {/* CAPA Details */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CAPA Details</p>
              <button
                onClick={generateWithAI}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {aiLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" />Generate with AI</>
                }
              </button>
            </div>

            {aiApplied && (
              <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <p className="text-xs text-violet-700">AI suggestions applied — review and edit each field before saving.</p>
              </div>
            )}

            <div className="space-y-4">
              <TextField label="Immediate containment action" value={draft.immediate_action ?? ''} onChange={v => set('immediate_action', v)}
                placeholder="What was done immediately to contain the issue?" />

              {/* Root cause analysis */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Root cause analysis</label>
                  <div className="flex gap-1">
                    {RCA_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => switchFramework(opt.value)}
                        title={opt.description}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          framework === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {framework === 'narrative' && (
                  <textarea
                    value={draft.root_cause ?? ''}
                    onChange={e => set('root_cause', e.target.value)}
                    placeholder="Describe the root cause of this non-conformance…"
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                )}

                {framework === '5_whys' && (
                  <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {([1,2,3,4,5] as const).map(n => (
                      <div key={n} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-blue-600 mt-2 w-12 shrink-0">Why {n}?</span>
                        <input
                          type="text"
                          value={rcaData[`why${n}`] ?? ''}
                          onChange={e => setRCAField(`why${n}`, e.target.value)}
                          placeholder={n === 1 ? 'Why did this happen?' : `Why did "${rcaData[`why${n-1}`] || '…'}" happen?`}
                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {framework === 'fishbone' && (
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {[
                      { key: 'man',         label: 'Man / People' },
                      { key: 'machine',     label: 'Machine / Equipment' },
                      { key: 'method',      label: 'Method / Process' },
                      { key: 'material',    label: 'Material' },
                      { key: 'environment', label: 'Environment' },
                      { key: 'measurement', label: 'Measurement' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input
                          type="text"
                          value={rcaData[key] ?? ''}
                          onChange={e => setRCAField(key, e.target.value)}
                          placeholder={`Contributing factors…`}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <TextField label="Corrective action" value={draft.corrective_action ?? ''} onChange={v => set('corrective_action', v)}
                placeholder="What action will be taken to correct the issue?" rows={3} />
              <TextField label="Preventive action" value={draft.preventive_action ?? ''} onChange={v => set('preventive_action', v)}
                placeholder="What will prevent recurrence?" rows={3} />
            </div>
          </div>

          {/* Verification */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Verification</p>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Verification method" value={draft.verification_method ?? ''} onChange={v => set('verification_method', v)}
                placeholder="How will effectiveness be verified?" />
              <TextField label="Verified by" value={draft.verified_by ?? ''} onChange={v => set('verified_by', v)}
                placeholder="Name of verifier" />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Identified: {new Date(action.identified_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={save}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Save CAPA
          </button>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder, rows = 2
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
    </div>
  )
}
