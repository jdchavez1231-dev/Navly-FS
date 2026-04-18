import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Upload, FileText, AlertTriangle, CheckCircle, Clock, Trash2, ShieldCheck, X, Sparkles, Copy, Download, ChevronLeft, Loader2, MessageSquare, ImagePlus, BookOpen, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useFacility } from '../hooks/useFacility'
import { extractTextFromUrl } from '../lib/extractText'
import { analyzeSOPWithClaude, generateSOPWithClaude, editSOPWithClaude } from '../lib/claudeApi'
import type { SOPFormat } from '../lib/claudeApi'
import { BRCGS_SECTIONS } from '../data/brcgs'
import { generateSOPPDF } from '../lib/reportGenerator'
import { loadFacilityProfile } from './Onboarding'

const SOP_TYPES = [
  'Cleaning & Sanitation Procedure',
  'Pest Control Program',
  'Temperature Monitoring & Control',
  'Allergen Management',
  'Food Defense & Security',
  'Traceability & Product Recall',
  'Personal Hygiene & Conduct',
  'Supplier Approval & Monitoring',
  'Internal Auditing',
  'Corrective & Preventive Action (CAPA)',
  'Document & Record Control',
  'Foreign Body Prevention',
  'Equipment Calibration & Maintenance',
  'Labeling & Packaging Control',
  'Receiving, Storage & Distribution',
  'Staff Training & Competency',
  'Waste Management',
  'Water Quality Management',
  'Other (specify in context field)',
]

const FACILITY_TYPES = [
  'Bakery / Confectionery',
  'Meat & Poultry Processing',
  'Dairy Processing',
  'Fresh Produce / Fruits & Vegetables',
  'Seafood Processing',
  'Beverage Manufacturing',
  'Ready-to-Eat Foods',
  'Dry Goods / Grains / Cereals',
  'Frozen Foods / Cold Chain',
  'Snack Foods',
  'Sauces, Condiments & Dressings',
  'Other Food Manufacturing',
]

type SOPDocument = {
  id: string
  file_name: string
  file_url: string
  mapped_standard: string | null
  compliance_status: 'pending' | 'compliant' | 'gaps_found'
  uploaded_at: string
}

const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_MB = 20

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    icon: Clock,         className: 'bg-gray-100 text-gray-600' },
  compliant:  { label: 'Compliant',  icon: CheckCircle,   className: 'bg-green-50 text-green-700' },
  gaps_found: { label: 'Gaps Found', icon: AlertTriangle, className: 'bg-red-50 text-red-600' },
}

export default function SOPLibrary() {
  const { facilityId, facility } = useFacility()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<SOPDocument[]>([])

  useEffect(() => { document.title = 'SOP Library — Navly FS' }, [])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Analyze modal state
  const [analyzingDoc, setAnalyzingDoc] = useState<SOPDocument | null>(null)
  const [selectedElement, setSelectedElement] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  // SOP Builder state
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => {
    if (!facilityId) return
    loadDocs()
  }, [facilityId])

  async function loadDocs() {
    const { data } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('facility_id', facilityId)
      .order('uploaded_at', { ascending: false })
    if (data) setDocs(data as SOPDocument[])
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !facilityId) return
    const file = files[0]
    setError('')

    if (!ACCEPTED.includes(file.type)) {
      setError('Only PDF and DOCX files are accepted.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`)
      return
    }

    setUploading(true)
    const path = `${facilityId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('sop-documents')
      .upload(path, file)

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('sop-documents')
      .getPublicUrl(path)

    await supabase.from('sop_documents').insert({
      facility_id: facilityId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      compliance_status: 'pending',
    })

    await loadDocs()
    setUploading(false)
  }

  async function handleDelete(doc: SOPDocument) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    const path = doc.file_url.split('/sop-documents/')[1]
    await supabase.storage.from('sop-documents').remove([path])
    await supabase.from('sop_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  async function handleAnalyze() {
    if (!analyzingDoc || !selectedElement || !facilityId) return
    setAnalyzeError('')
    setAnalyzing(true)

    try {
      // Find the clause details
      const clause = BRCGS_SECTIONS.flatMap(s => s.clauses).find(c => c.id === selectedElement)
      if (!clause) throw new Error('Element not found')

      // Extract text from the file
      const text = await extractTextFromUrl(analyzingDoc.file_url, analyzingDoc.file_name)
      if (!text.trim()) throw new Error('Could not extract text from this file.')

      // Call Claude
      const gaps = await analyzeSOPWithClaude(text, 'BRCGS', clause.id, clause.title)

      // Save gap report
      const { data: report } = await supabase
        .from('gap_reports')
        .insert({
          facility_id: facilityId,
          sop_document_id: analyzingDoc.id,
          gaps,
        })
        .select('id')
        .single()

      // Update SOP compliance status
      const newStatus = gaps.length === 0 ? 'compliant' : 'gaps_found'
      await supabase
        .from('sop_documents')
        .update({ compliance_status: newStatus, mapped_standard: `BRCGS ${clause.id}` })
        .eq('id', analyzingDoc.id)

      await loadDocs()
      setAnalyzingDoc(null)

      if (report) navigate(`/gap-report/${report.id}`)
    } catch (err: any) {
      setAnalyzeError(err.message ?? 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">SOP Library</h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage your standard operating procedures</p>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Build SOP with AI
          </button>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-8 ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Drop a file here or click to upload</p>
              <p className="text-xs text-gray-400">PDF or DOCX · Max {MAX_MB}MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
        )}

        {/* SOP list */}
        {docs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No SOPs uploaded yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">File</th>
                  <th className="text-left px-5 py-3 font-medium">Mapped to</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => {
                  const status = STATUS_CONFIG[doc.compliance_status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <a href={doc.file_url} target="_blank" rel="noreferrer"
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline truncate max-w-xs">
                            {doc.file_name}
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {doc.mapped_standard ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => { setAnalyzingDoc(doc); setSelectedElement(''); setAnalyzeError('') }}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Audit
                          </button>
                          <button onClick={() => handleDelete(doc)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SOP Builder modal */}
      {showBuilder && (
        <SOPBuilderModal
          onClose={() => setShowBuilder(false)}
          facilityId={facilityId}
          facilityName={facility?.name}
          onSaved={() => { loadDocs(); setShowBuilder(false) }}
        />
      )}

      {/* Analyze modal */}

      {analyzingDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Audit SOP</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{analyzingDoc.file_name}</p>
              </div>
              <button onClick={() => setAnalyzingDoc(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Which BRCGS element does this SOP cover?
              </label>
              <select
                value={selectedElement}
                onChange={e => setSelectedElement(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an element…</option>
                {BRCGS_SECTIONS.map(section => (
                  <optgroup key={section.id} label={`Section ${section.id}: ${section.title}`}>
                    {section.clauses.map(clause => (
                      <option key={clause.id} value={clause.id}>
                        {clause.id} — {clause.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {analyzeError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {analyzeError}
              </div>
            )}

            {analyzing && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                Analyzing against BRCGS {selectedElement}… this takes 10–20 seconds
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAnalyzingDoc(null)}
                disabled={analyzing}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!selectedElement || analyzing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {analyzing ? 'Analyzing…' : 'Run Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SOP Builder Modal ──────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { id: SOPFormat; label: string; desc: string }[] = [
  { id: 'concise', label: 'Concise', desc: '1–2 pages · Quick reference' },
  { id: 'standard', label: 'Standard', desc: '2–4 pages · GFSI/BRCGS format' },
  { id: 'iso', label: 'ISO / FSSC', desc: '3–5 pages · Full document control' },
]

function SOPBuilderModal({
  onClose,
  facilityId,
  facilityName,
  onSaved,
}: {
  onClose: () => void
  facilityId: string | null
  facilityName?: string
  onSaved: () => void
}) {
  const profile = loadFacilityProfile()
  const [clauseId, setClauseId] = useState('')
  const [sopType, setSopType] = useState('')
  const [facilityType, setFacilityType] = useState(profile?.facilityType ?? '')
  const [context, setContext] = useState(
    profile?.allergens?.length ? `Allergens on site: ${profile.allergens.join(', ')}.${profile.products ? ' Products: ' + profile.products + '.' : ''}` : ''
  )
  const [format, setFormat] = useState<SOPFormat>('standard')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'sop' | 'edit'>('sop')
  const [editInstruction, setEditInstruction] = useState('')
  const [editing, setEditing] = useState(false)

  const allClauses = BRCGS_SECTIONS.flatMap(s => s.clauses)
  const selectedClause = allClauses.find(c => c.id === clauseId)
  const canGenerate = clauseId && sopType && facilityType

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLogoUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    if (!selectedClause || !sopType || !facilityType) return
    setError('')
    setGenerating(true)
    setSaved(false)
    try {
      const text = await generateSOPWithClaude({
        clauseId: selectedClause.id,
        clauseTitle: selectedClause.title,
        clauseDescription: selectedClause.description,
        sopType,
        facilityType,
        additionalContext: context,
        format,
      })
      setResult(text)
      setActiveTab('sop')
    } catch (err: any) {
      setError(err.message ?? 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleEdit() {
    if (!editInstruction.trim()) return
    setEditing(true)
    setSaved(false)
    try {
      const updated = await editSOPWithClaude(result, editInstruction)
      setResult(updated)
      setEditInstruction('')
      setActiveTab('sop')
    } catch (err: any) {
      setError(err.message ?? 'Edit failed.')
    } finally {
      setEditing(false)
    }
  }

  async function handleSave() {
    if (!facilityId || !result) return
    setSaving(true)
    try {
      const fileName = `SOP-${clauseId.replace(/\./g, '-')}-${sopType.split(' ')[0]}-${Date.now()}.txt`
      const blob = new Blob([result], { type: 'text/plain' })
      const path = `${facilityId}/${fileName}`

      const { error: uploadErr } = await supabase.storage.from('sop-documents').upload(path, blob)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('sop-documents').getPublicUrl(path)
      await supabase.from('sop_documents').insert({
        facility_id: facilityId,
        file_name: fileName,
        file_url: urlData.publicUrl,
        compliance_status: 'pending',
        mapped_standard: selectedClause ? `BRCGS ${selectedClause.id}` : null,
      })
      setSaved(true)
      onSaved()
    } catch (err: any) {
      setError(err.message ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    const sopName = sopType || (selectedClause ? `Clause ${selectedClause.id}` : 'SOP')
    await generateSOPPDF({ content: result, title: sopName, facilityName })
  }

  const selectCls = 'w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            {result && (
              <button onClick={() => { setResult(''); setSaved(false); setActiveTab('sop') }}
                className="text-gray-400 hover:text-gray-600 mr-1" aria-label="Back to form">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {result ? 'AI-Generated SOP' : 'Build SOP with AI'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        {result && (
          <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
            {([
              { id: 'sop', label: 'Preview', icon: BookOpen },
              { id: 'edit', label: 'Edit via prompt', icon: MessageSquare },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="px-6 py-5 space-y-5">

              {/* Format picker */}
              <div>
                <label className={labelCls}>Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map(f => (
                    <button key={f.id} type="button" onClick={() => setFormat(f.id)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        format === f.id
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}>
                      <div className="font-medium">{f.label}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* BRCGS clause */}
              <div>
                <label className={labelCls}>BRCGS clause <span className="text-red-500">*</span></label>
                <select value={clauseId} onChange={e => setClauseId(e.target.value)} className={selectCls}>
                  <option value="">Select a clause…</option>
                  {BRCGS_SECTIONS.map(section => (
                    <optgroup key={section.id} label={`Section ${section.id}: ${section.title}`}>
                      {section.clauses.map(clause => (
                        <option key={clause.id} value={clause.id}>{clause.id} — {clause.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedClause && (
                  <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">{selectedClause.description}</p>
                )}
              </div>

              {/* SOP type */}
              <div>
                <label className={labelCls}>SOP type <span className="text-red-500">*</span></label>
                <select value={sopType} onChange={e => setSopType(e.target.value)} className={selectCls}>
                  <option value="">Select a type…</option>
                  {SOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Facility type */}
              <div>
                <label className={labelCls}>Facility type <span className="text-red-500">*</span></label>
                <select value={facilityType} onChange={e => setFacilityType(e.target.value)} className={selectCls}>
                  <option value="">Select your facility type…</option>
                  {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Logo upload */}
              <div>
                <label className={labelCls}>Company logo <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <>
                      <img src={logoUrl} alt="Logo preview" className="h-10 w-auto object-contain rounded border border-gray-200 dark:border-gray-600 p-1 bg-white" />
                      <button onClick={() => setLogoUrl(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => logoRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <ImagePlus className="w-4 h-4" />
                      Upload logo
                    </button>
                  )}
                </div>
              </div>

              {/* Context */}
              <div>
                <label className={labelCls}>Additional context <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
                <textarea value={context} onChange={e => setContext(e.target.value)}
                  placeholder="E.g. We handle peanuts as a major allergen. Cleaning is done by a third-party contractor…"
                  rows={3}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 text-gray-900" />
              </div>

              {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              {generating && (
                <div role="status" className="flex items-center gap-2 text-sm text-gray-500 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" aria-hidden="true" />
                  Writing your SOP… this takes 15–30 seconds
                </div>
              )}
            </div>

          ) : activeTab === 'sop' ? (
            /* ── Rendered SOP ── */
            <div className="px-8 py-6 bg-white dark:bg-gray-900">
              {logoUrl && (
                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <img src={logoUrl} alt="Company logo" className="h-12 w-auto object-contain" />
                </div>
              )}
              <div className="prose prose-sm prose-gray dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-h1:text-xl prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h1:pb-3 prose-h1:mb-4
                prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2
                prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1.5
                prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-0.5
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-table:text-sm prose-td:py-2 prose-td:px-3 prose-th:py-2 prose-th:px-3
                prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:font-semibold prose-th:text-gray-700 dark:prose-th:text-gray-300
                prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-700
                prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700
                prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-4">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>

          ) : (
            /* ── Edit tab ── */
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Describe what to change — Claude will update the SOP.</p>
              <textarea value={editInstruction} onChange={e => setEditInstruction(e.target.value)}
                placeholder='E.g. "Shorten the procedure to 5 steps" or "Add a step about allergen bin labeling"'
                rows={4}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 text-gray-900" />
              {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              {editing && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" />Applying edit…
                </div>
              )}
              <button onClick={handleEdit} disabled={!editInstruction.trim() || editing}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {editing ? <><Loader2 className="w-4 h-4 animate-spin" />Applying…</> : <><MessageSquare className="w-4 h-4" />Apply Edit</>}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          {!result ? (
            <div className="flex gap-3">
              <button onClick={onClose} disabled={generating}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={!canGenerate || generating}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate SOP</>}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Download className="w-3.5 h-3.5" />Download
              </button>
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saved
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50'
                }`}>
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : saved ? 'Saved to Library' : 'Save to Library'}
              </button>
              <button onClick={() => { setResult(''); setSaved(false); setActiveTab('sop'); setError('') }}
                className="ml-auto px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
                New SOP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
