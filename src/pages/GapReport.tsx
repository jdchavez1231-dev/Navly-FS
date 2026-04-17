import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { GapFinding } from '../lib/claudeApi'

type SopDoc = { file_name: string; mapped_standard: string | null }

type Report = {
  id: string
  generated_at: string
  gaps: GapFinding[]
  sop_documents: SopDoc
}

export default function GapReport() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) return
    supabase
      .from('gap_reports')
      .select('id, generated_at, gaps, sop_documents(file_name, mapped_standard)')
      .eq('id', reportId)
      .single()
      .then(({ data }) => {
        if (data) {
          const raw = data as Omit<Report, 'sop_documents'> & { sop_documents: SopDoc | SopDoc[] }
          const sop = Array.isArray(raw.sop_documents) ? raw.sop_documents[0] : raw.sop_documents
          setReport({ ...raw, sop_documents: sop })
        }
        setLoading(false)
      })
  }, [reportId])

  async function exportPDF() {
    if (!report) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const gaps = report.gaps

    doc.setFontSize(18)
    doc.text('BRCGS Gap Report', 14, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`SOP: ${report.sop_documents.file_name}`, 14, 30)
    doc.text(`Element: ${report.sop_documents.mapped_standard ?? '—'}`, 14, 37)
    doc.text(`Date: ${new Date(report.generated_at).toLocaleDateString()}`, 14, 44)
    doc.text(`Total gaps: ${gaps.length}`, 14, 51)

    doc.setTextColor(0)
    let y = 62

    if (gaps.length === 0) {
      doc.setFontSize(12)
      doc.text('No gaps found. SOP is compliant with this element.', 14, y)
    } else {
      gaps.forEach((gap, i) => {
        if (y > 270) { doc.addPage(); y = 20 }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${i + 1}. ${gap.element_code}`, 14, y)
        y += 7

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(60)
        const reqLines = doc.splitTextToSize(`Requirement: ${gap.requirement}`, 180)
        doc.text(reqLines, 14, y)
        y += reqLines.length * 5 + 3

        doc.setTextColor(180, 0, 0)
        const gapLines = doc.splitTextToSize(`Gap: ${gap.gap_description}`, 180)
        doc.text(gapLines, 14, y)
        y += gapLines.length * 5 + 8
        doc.setTextColor(0)
      })
    }

    doc.save(`gap-report-${report.sop_documents.file_name}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading report…
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Report not found.
      </div>
    )
  }

  const gaps = report.gaps
  const isCompliant = gaps.length === 0

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/sop-library')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Gap Report</h1>
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{report.sop_documents.file_name}</span>
              </div>
              <div className="text-xs text-gray-500">
                Element: <span className="font-medium text-gray-700">{report.sop_documents.mapped_standard ?? '—'}</span>
              </div>
              <div className="text-xs text-gray-400">
                Analyzed {new Date(report.generated_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              isCompliant ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {isCompliant
                ? <><CheckCircle className="w-4 h-4" /> Compliant</>
                : <><AlertTriangle className="w-4 h-4" /> {gaps.length} Gap{gaps.length !== 1 ? 's' : ''} Found</>
              }
            </div>
          </div>
        </div>

        {/* Gap findings */}
        {isCompliant ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">No gaps found</p>
            <p className="text-xs text-green-600 mt-1">This SOP satisfies all requirements for this element.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-gray-400">{gap.element_code}</span>
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-medium">
                    Gap #{i + 1}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requirement</p>
                  <p className="text-sm text-gray-700">{gap.requirement}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Gap identified</p>
                  <p className="text-sm text-gray-800">{gap.gap_description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
