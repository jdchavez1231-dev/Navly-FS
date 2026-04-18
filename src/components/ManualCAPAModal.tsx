import { useEffect, useRef, useState } from 'react'
import { X, Plus, Sparkles, Loader2 } from 'lucide-react'
import type { Rating, RCAFramework, FiveWhysData, FishboneData, CorrectiveAction } from '../types'

const CATEGORIES = [
  'GMP',
  'HACCP',
  'Allergen Management',
  'Pest Control',
  'Sanitation',
  'Customer Complaint',
  'Supplier Non-conformance',
  'Internal Audit',
  'Environmental Monitoring',
  'Training',
  'Equipment / Maintenance',
  'Documentation',
  'Other',
]

const SEVERITY_OPTIONS: { value: Rating; label: string; desc: string; color: string }[] = [
  { value: 'fundamental', label: 'Critical',  desc: 'Immediate food safety risk',      color: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400' },
  { value: 'major',       label: 'Major',     desc: 'Significant systemic issue',       color: 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400' },
  { value: 'minor',       label: 'Minor',     desc: 'Low-risk or isolated finding',     color: 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400' },
]

const RCA_OPTIONS: { value: RCAFramework; label: string; description: string }[] = [
  { value: 'narrative', label: 'Narrative',           description: 'Free-form root cause description' },
  { value: '5_whys',    label: '5 Whys',              description: 'Ask "Why?" five times' },
  { value: 'fishbone',  label: 'Fishbone (Ishikawa)', description: 'Categorise causes across 6 dimensions' },
]

const EMPTY_5WHYS: FiveWhysData = { why1: '', why2: '', why3: '', why4: '', why5: '' }
const EMPTY_FISHBONE: FishboneData = { man: '', machine: '', method: '', material: '', environment: '', measurement: '' }

interface Props {
  onSave: (params: {
    category: string
    title: string
    severity: Rating
    description: string
    assigned_to: string
    due_date: string
    rca_framework: RCAFramework
    rca_data: Record<string, string>
    immediate_action: string
    root_cause: string
    corrective_action: string
    preventive_action: string
    verification_method: string
    verified_by: string
  }) => Promise<void>
  onClose: () => void
}

type Draft = {
  category: string
  title: string
  severity: Rating
  description: string
  assigned_to: string
  due_date: string
  rca_framework: RCAFramework
  rca_data: Record<string, string>
  immediate_action: string
  root_cause: string
  corrective_action: string
  preventive_action: string
  verification_method: string
  verified_by: string
}

export function ManualCAPAModal({ onSave, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  const [draft, setDraft] = useState<Draft>({
    category: CATEGORIES[0],
    title: '',
    severity: 'major',
    description: '',
    assigned_to: '',
    due_date: '',
    rca_framework: 'narrative',
    rca_data: {},
    immediate_action: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: '',
    verification_method: '',
    verified_by: '',
  })

  // Focus trap + Escape
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    return () => { prev?.focus() }
  }, [])

  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  function setRCAField(key: string, value: string) {
    setDraft(prev => ({ ...prev, rca_data: { ...prev.rca_data, [key]: value } }))
  }

  function switchFramework(fw: RCAFramework) {
    set('rca_framework', fw)
    if (fw === '5_whys' && !('why1' in draft.rca_data)) set('rca_data', EMPTY_5WHYS as any)
    if (fw === 'fishbone' && !('man' in draft.rca_data)) set('rca_data', EMPTY_FISHBONE as any)
  }

  async function generateWithAI() {
    setAiLoading(true)
    setAiApplied(false)
    const frameworkLabel = RCA_OPTIONS.find(o => o.value === draft.rca_framework)?.label ?? 'Narrative'
    const severityLabel = SEVERITY_OPTIONS.find(o => o.value === draft.severity)?.label ?? draft.severity
    const prompt = `You are a food safety CAPA specialist. Generate practical CAPA content for the following issue:

Category: ${draft.category}
Issue: ${draft.title || 'Not specified'}
Severity: ${severityLabel}
Description: ${draft.description || 'Not specified'}
RCA Framework: ${frameworkLabel}

Return ONLY valid JSON with these fields:
${draft.rca_framework === '5_whys' ? '"rca_data": { "why1": "...", "why2": "...", "why3": "...", "why4": "...", "why5": "..." },' : ''}
${draft.rca_framework === 'fishbone' ? '"rca_data": { "man": "...", "machine": "...", "method": "...", "material": "...", "environment": "...", "measurement": "..." },' : ''}
${draft.rca_framework === 'narrative' ? '"root_cause": "...",' : ''}
"immediate_action": "...",
"corrective_action": "...",
"preventive_action": "...",
"verification_method": "..."

Be specific and practical for a food manufacturing setting. 1-3 sentences per field. No markdown.`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
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
        ...(draft.rca_framework === 'narrative' && suggested.root_cause ? { root_cause: suggested.root_cause } : {}),
        ...(suggested.rca_data ? { rca_data: suggested.rca_data } : {}),
      }))
      setAiApplied(true)
    } catch {
      // silent fail
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    if (!draft.title.trim()) return
    setSaving(true)
    await onSave(draft)
    setSaving(false)
  }

  const rcaData = draft.rca_data as any
  const canSave = draft.title.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-capa-title"
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            <h2 id="new-capa-title" className="text-base font-semibold text-gray-900 dark:text-white">New CAPA</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Issue identity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <select
                value={draft.category}
                onChange={e => set('category', e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Issue title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={draft.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Brief description of the issue…"
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Severity picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('severity', opt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                    draft.severity === opt.value
                      ? opt.color + ' border-2'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assigned to</label>
              <input type="text" value={draft.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                placeholder="Name or team"
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due date</label>
              <input type="date" value={draft.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <TextField label="Issue description" value={draft.description} onChange={v => set('description', v)}
            placeholder="What was observed? Where? Any immediate impact?" dark />

          {/* CAPA details */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">CAPA Details</p>
              <button
                onClick={generateWithAI}
                disabled={aiLoading || !draft.title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {aiLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" />Generate with AI</>
                }
              </button>
            </div>

            {aiApplied && (
              <div className="mb-4 flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-400">AI suggestions applied — review and edit before saving.</p>
              </div>
            )}

            <div className="space-y-4">
              <TextField label="Immediate containment action" value={draft.immediate_action} onChange={v => set('immediate_action', v)}
                placeholder="What was done right away to contain the issue?" dark />

              {/* RCA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Root cause analysis</label>
                  <div className="flex gap-1">
                    {RCA_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => switchFramework(opt.value)} title={opt.description}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          draft.rca_framework === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {draft.rca_framework === 'narrative' && (
                  <textarea value={draft.root_cause} onChange={e => set('root_cause', e.target.value)}
                    placeholder="Describe the root cause…" rows={3}
                    className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                )}

                {draft.rca_framework === '5_whys' && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    {([1,2,3,4,5] as const).map(n => (
                      <div key={n} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 w-12 shrink-0">Why {n}?</span>
                        <input type="text" value={rcaData[`why${n}`] ?? ''} onChange={e => setRCAField(`why${n}`, e.target.value)}
                          placeholder={n === 1 ? 'Why did this happen?' : `Why did "${rcaData[`why${n-1}`] || '…'}" happen?`}
                          className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                      </div>
                    ))}
                  </div>
                )}

                {draft.rca_framework === 'fishbone' && (
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    {[
                      { key: 'man', label: 'Man / People' }, { key: 'machine', label: 'Machine / Equipment' },
                      { key: 'method', label: 'Method / Process' }, { key: 'material', label: 'Material' },
                      { key: 'environment', label: 'Environment' }, { key: 'measurement', label: 'Measurement' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                        <input type="text" value={rcaData[key] ?? ''} onChange={e => setRCAField(key, e.target.value)}
                          placeholder="Contributing factors…"
                          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <TextField label="Corrective action" value={draft.corrective_action} onChange={v => set('corrective_action', v)}
                placeholder="What action will correct the issue?" rows={3} dark />
              <TextField label="Preventive action" value={draft.preventive_action} onChange={v => set('preventive_action', v)}
                placeholder="What will prevent recurrence?" rows={3} dark />
            </div>
          </div>

          {/* Verification */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Verification</p>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Verification method" value={draft.verification_method} onChange={v => set('verification_method', v)}
                placeholder="How will effectiveness be verified?" dark />
              <TextField label="Verified by" value={draft.verified_by} onChange={v => set('verified_by', v)}
                placeholder="Name of verifier" dark />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium transition-colors">
            {saving ? 'Creating…' : 'Create CAPA'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder, rows = 2, dark
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number; dark?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={`w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          dark ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500' : 'bg-gray-50'
        }`} />
    </div>
  )
}
