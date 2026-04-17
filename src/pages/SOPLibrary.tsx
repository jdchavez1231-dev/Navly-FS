import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, AlertTriangle, CheckCircle, Clock, Trash2, Zap, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useFacility } from '../hooks/useFacility'
import { extractTextFromUrl } from '../lib/extractText'
import { analyzeSOPWithClaude } from '../lib/claudeApi'
import { BRCGS_SECTIONS } from '../data/brcgs'

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
  const { facilityId } = useFacility()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<SOPDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Analyze modal state
  const [analyzingDoc, setAnalyzingDoc] = useState<SOPDocument | null>(null)
  const [selectedElement, setSelectedElement] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

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
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">SOP Library</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your standard operating procedures</p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-8 ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
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
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
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
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
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
                            <Zap className="w-3.5 h-3.5" />
                            Analyze
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

      {/* Analyze modal */}
      {analyzingDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Analyze SOP</h2>
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
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!selectedElement || analyzing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {analyzing ? 'Analyzing…' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
