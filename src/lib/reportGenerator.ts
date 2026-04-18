import type { TrackerData, CorrectiveAction } from '../types'
import { BRCGS_SECTIONS, getAllStats, getSectionStats } from '../data/brcgs'

type FacilityInfo = {
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  audit_date?: string | null
  contact_name?: string
  contact_email?: string
  regulatory_body?: string
  active_standard?: string
}

const BRAND = '#0A2340'
const ACCENT = '#0F6E56'
const RED = '#DC2626'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const GRAY = '#6B7280'
const LIGHT = '#F3F4F6'

function hex(color: string): [number, number, number] {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return [r, g, b]
}

export async function generateReadinessReport(
  data: TrackerData,
  actions: CorrectiveAction[],
  facility: FacilityInfo
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const margin = 16
  const contentW = W - margin * 2

  const stats = getAllStats(data)
  const score = stats.assessed > 0 ? Math.round((stats.compliant / stats.assessed) * 100) : 0
  const daysToAudit = facility.audit_date
    ? Math.ceil((new Date(facility.audit_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const openCAs = actions.filter(a => a.status === 'open').length
  const inProgressCAs = actions.filter(a => a.status === 'in_progress').length
  const overdueCAs = actions.filter(a =>
    a.due_date && new Date(a.due_date) < new Date() && a.status !== 'closed' && a.status !== 'verified'
  ).length
  const closedCAs = actions.filter(a => a.status === 'closed' || a.status === 'verified').length

  // ── Cover page ──────────────────────────────────────────────────────────────
  doc.setFillColor(...hex(BRAND))
  doc.rect(0, 0, W, 80, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Audit Readiness Report', margin, 32)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('BRCGS Food Safety — Issue 9', margin, 42)

  doc.setFontSize(10)
  doc.setTextColor(200, 220, 255)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 52)

  // Facility info block
  doc.setFillColor(...hex(LIGHT))
  doc.rect(0, 80, W, 50, 'F')

  doc.setTextColor(...hex(BRAND))
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(facility.name || 'Facility', margin, 97)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hex(GRAY))

  const addressLine = [facility.address, facility.city, facility.state, facility.country].filter(Boolean).join(', ')
  if (addressLine) doc.text(addressLine, margin, 106)
  if (facility.contact_name) doc.text(`Contact: ${facility.contact_name}${facility.contact_email ? ' · ' + facility.contact_email : ''}`, margin, 113)

  // Score ring (simple circle)
  const cx = W - 35, cy = 100
  doc.setDrawColor(...hex(LIGHT))
  doc.setLineWidth(0)
  doc.setFillColor(...hex(score >= 80 ? GREEN : score >= 50 ? AMBER : RED))
  doc.circle(cx, cy, 18, 'F')
  doc.setFillColor(255, 255, 255)
  doc.circle(cx, cy, 12, 'F')
  doc.setTextColor(...hex(score >= 80 ? GREEN : score >= 50 ? AMBER : RED))
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${score}%`, cx, cy + 1.5, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hex(GRAY))
  doc.text('Score', cx, cy + 7, { align: 'center' })

  if (daysToAudit !== null && daysToAudit >= 0) {
    doc.setFillColor(...hex(daysToAudit <= 30 ? RED : daysToAudit <= 90 ? AMBER : ACCENT))
    doc.roundedRect(margin, 122, 60, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${daysToAudit} days to audit — ${new Date(facility.audit_date!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + 3, 128.5)
  }

  // ── Executive Summary ───────────────────────────────────────────────────────
  let y = 148

  sectionHeader(doc, 'Executive Summary', margin, y, contentW)
  y += 12

  const summaryRows = [
    ['Total clauses', String(stats.total), ''],
    ['Assessed', String(stats.assessed), `${stats.total > 0 ? Math.round((stats.assessed / stats.total) * 100) : 0}%`],
    ['Compliant', String(stats.compliant), score > 0 ? `${score}% of assessed` : '—'],
    ['Gaps identified', String(stats.gaps), stats.gaps > 0 ? 'Require corrective action' : 'None'],
    ['Not yet assessed', String(stats.notAssessed), ''],
  ]

  y = tableRows(doc, summaryRows, margin, y, contentW, [90, 30, 58])

  y += 8
  sectionHeader(doc, 'Corrective Actions Summary', margin, y, contentW)
  y += 12

  const caRows = [
    ['Open', String(openCAs), openCAs > 0 ? '⚠ Requires attention' : ''],
    ['In progress', String(inProgressCAs), ''],
    ['Overdue', String(overdueCAs), overdueCAs > 0 ? '⚠ Past due date' : 'None'],
    ['Closed / Verified', String(closedCAs), ''],
  ]
  y = tableRows(doc, caRows, margin, y, contentW, [90, 30, 58])

  // ── Section Breakdown ───────────────────────────────────────────────────────
  doc.addPage()
  y = margin + 8

  sectionHeader(doc, 'Section Breakdown', margin, y, contentW)
  y += 12

  // Column headers
  doc.setFillColor(...hex(BRAND))
  doc.rect(margin, y, contentW, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Section', margin + 3, y + 4.8)
  doc.text('Compliant', margin + contentW - 75, y + 4.8)
  doc.text('Gaps', margin + contentW - 48, y + 4.8)
  doc.text('Score', margin + contentW - 20, y + 4.8)
  y += 7

  let rowAlt = false
  for (const section of BRCGS_SECTIONS) {
    if (y > 270) { doc.addPage(); y = margin + 8 }
    const s = getSectionStats(section, data)
    const pct = s.assessed > 0 ? Math.round((s.compliant / s.assessed) * 100) : 0

    doc.setFillColor(...hex(rowAlt ? LIGHT : '#FFFFFF'))
    doc.rect(margin, y, contentW, 7.5, 'F')

    doc.setTextColor(...hex(BRAND))
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${section.id}.`, margin + 3, y + 5.2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...hex(GRAY))
    const title = section.title.length > 48 ? section.title.slice(0, 48) + '…' : section.title
    doc.text(title, margin + 10, y + 5.2)

    doc.text(`${s.compliant}/${s.total}`, margin + contentW - 72, y + 5.2)
    if (s.gaps > 0) {
      doc.setTextColor(...hex(RED))
      doc.text(String(s.gaps), margin + contentW - 44, y + 5.2)
      doc.setTextColor(...hex(GRAY))
    } else {
      doc.text('—', margin + contentW - 44, y + 5.2)
    }

    // Progress bar
    const barW = 22, barH = 2.5, barX = margin + contentW - 26, barY = y + 2.5
    doc.setFillColor(...hex(LIGHT))
    doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F')
    if (pct > 0) {
      doc.setFillColor(...hex(pct === 100 ? GREEN : pct > 50 ? ACCENT : AMBER))
      doc.roundedRect(barX, barY, Math.max((pct / 100) * barW, 1), barH, 1, 1, 'F')
    }

    doc.setTextColor(...hex(GRAY))
    doc.text(s.assessed > 0 ? `${pct}%` : '—', margin + contentW - 1, y + 5.2, { align: 'right' })

    y += 7.5
    rowAlt = !rowAlt
  }

  // ── Gaps & CAPA Status ──────────────────────────────────────────────────────
  const gapClauses = BRCGS_SECTIONS.flatMap(s =>
    s.clauses.filter(c => data[c.id]?.status === 'gap').map(c => ({ ...c, notes: data[c.id]?.notes ?? '' }))
  )

  if (gapClauses.length > 0) {
    doc.addPage()
    y = margin + 8

    sectionHeader(doc, `Gaps & Corrective Actions (${gapClauses.length})`, margin, y, contentW)
    y += 12

    for (const clause of gapClauses) {
      if (y > 260) { doc.addPage(); y = margin + 8 }

      const ca = actions.find(a => a.element_code === clause.id && a.status !== 'verified')

      // Clause row header
      doc.setFillColor(...hex(clause.rating === 'fundamental' ? '#FEF2F2' : clause.rating === 'major' ? '#FFF7ED' : '#FEFCE8'))
      doc.rect(margin, y, contentW, 8, 'F')
      doc.setTextColor(...hex(clause.rating === 'fundamental' ? RED : clause.rating === 'major' ? AMBER : '#854D0E'))
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(`${clause.id} — ${clause.rating.toUpperCase()}`, margin + 3, y + 5.2)
      doc.setFontSize(8.5)
      doc.setTextColor(...hex(BRAND))
      const titleStr = clause.title.length > 65 ? clause.title.slice(0, 65) + '…' : clause.title
      doc.text(titleStr, margin + 28, y + 5.2)
      y += 8

      // Notes / finding
      if (clause.notes) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...hex(GRAY))
        const noteLines = doc.splitTextToSize(`Finding: ${clause.notes}`, contentW - 6)
        const notesH = noteLines.length * 4 + 4
        if (y + notesH > 270) { doc.addPage(); y = margin + 8 }
        doc.text(noteLines, margin + 3, y + 4)
        y += notesH
      }

      // CAPA details
      if (ca) {
        const caColor = ca.status === 'closed' || ca.status === 'verified' ? GREEN : ca.status === 'in_progress' ? AMBER : RED
        doc.setFillColor(...hex('#F9FAFB'))
        const caLines: string[] = []
        caLines.push(`CAPA Status: ${ca.status.replace('_', ' ').toUpperCase()}${ca.assigned_to ? ' · Assigned: ' + ca.assigned_to : ''}${ca.due_date ? ' · Due: ' + new Date(ca.due_date).toLocaleDateString() : ''}`)
        if (ca.immediate_action) caLines.push(`Immediate action: ${ca.immediate_action}`)
        if (ca.corrective_action) caLines.push(`Corrective action: ${ca.corrective_action}`)

        const caH = caLines.length * 4.5 + 4
        if (y + caH > 270) { doc.addPage(); y = margin + 8 }
        doc.rect(margin, y, contentW, caH, 'F')
        doc.setDrawColor(...hex(caColor))
        doc.setLineWidth(0.8)
        doc.line(margin, y, margin, y + caH)
        doc.setLineWidth(0.2)

        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        let lineY = y + 4
        for (const line of caLines) {
          doc.setTextColor(...hex(line.startsWith('CAPA') ? caColor : GRAY))
          const wrapped = doc.splitTextToSize(line, contentW - 8)
          doc.text(wrapped, margin + 4, lineY)
          lineY += wrapped.length * 4.5
        }
        y += caH
      } else {
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...hex(RED))
        doc.text('No corrective action created yet.', margin + 3, y + 4)
        y += 6
      }

      y += 3 // gap between clauses
    }
  }

  // ── Footer on all pages ─────────────────────────────────────────────────────
  const pageCount = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...hex(BRAND))
    doc.rect(0, 292, W, 8, 'F')
    doc.setTextColor(200, 220, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${facility.name} · Navly Audit Readiness Report`, margin, 297.5)
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 297.5, { align: 'right' })
  }

  const filename = `${(facility.name || 'facility').replace(/\s+/g, '-')}-audit-readiness-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// ── Document PDF export ─────────────────────────────────────────────────────

export async function generateDocumentPDF(opts: {
  title: string
  typeLabel: string
  sections: { title: string; body: string; level: 1 | 2 }[]
  facilityName?: string
}) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 16, contentW = W - margin * 2
  let y = 0

  // Cover band
  doc.setFillColor(...hex(BRAND))
  doc.rect(0, 0, W, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const titleLines: string[] = doc.splitTextToSize(opts.title || 'Untitled Document', contentW)
  doc.text(titleLines, margin, 18)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 210, 255)
  doc.text(opts.typeLabel, margin, 32)

  // Sub-header
  doc.setFillColor(...hex(LIGHT))
  doc.rect(0, 40, W, 14, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...hex(GRAY))
  if (opts.facilityName) doc.text(opts.facilityName, margin, 49)
  doc.text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), W - margin, 49, { align: 'right' })

  y = 64

  for (let i = 0; i < opts.sections.length; i++) {
    const s = opts.sections[i]
    if (y > 270) { doc.addPage(); y = margin + 4 }

    // Section heading
    if (s.level === 1) {
      doc.setFillColor(...hex(BRAND))
      doc.rect(margin, y, contentW, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${i + 1}. ${s.title || 'Untitled'}`, margin + 3, y + 5.5)
    } else {
      doc.setFillColor(...hex(LIGHT))
      doc.rect(margin, y, contentW, 7, 'F')
      doc.setTextColor(...hex(BRAND))
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.text(`${i + 1}. ${s.title || 'Untitled'}`, margin + 6, y + 4.8)
    }
    y += s.level === 1 ? 10 : 9

    if (s.body) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...hex(GRAY))
      const lines: string[] = doc.splitTextToSize(s.body, contentW - 4)
      for (const line of lines) {
        if (y > 272) { doc.addPage(); y = margin + 4 }
        doc.text(line, margin + 4, y)
        y += 5
      }
      y += 3
    } else {
      y += 2
    }
  }

  // Footer
  const pageCount = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...hex(BRAND))
    doc.rect(0, 292, W, 8, 'F')
    doc.setTextColor(180, 210, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(opts.facilityName ? `${opts.facilityName} · ${opts.title}` : opts.title, margin, 297.5)
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 297.5, { align: 'right' })
  }

  const filename = `${opts.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// ── SOP PDF export (from markdown string) ──────────────────────────────────

export async function generateSOPPDF(opts: {
  content: string
  title: string
  facilityName?: string
}) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 16, contentW = W - margin * 2
  let y = 0

  // Cover band
  doc.setFillColor(...hex(BRAND))
  doc.rect(0, 0, W, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const titleLines: string[] = doc.splitTextToSize(opts.title || 'SOP', contentW)
  doc.text(titleLines, margin, 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 210, 255)
  doc.text('Standard Operating Procedure', margin, 34)

  doc.setFillColor(...hex(LIGHT))
  doc.rect(0, 40, W, 14, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...hex(GRAY))
  if (opts.facilityName) doc.text(opts.facilityName, margin, 49)
  doc.text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), W - margin, 49, { align: 'right' })

  y = 62

  const lines = opts.content.split('\n')
  for (const raw of lines) {
    if (y > 272) { doc.addPage(); y = margin + 4 }
    const line = raw.trim()
    if (!line) { y += 3; continue }

    if (line.startsWith('### ')) {
      const text = line.slice(4)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...hex(ACCENT))
      doc.text(text, margin + 6, y)
      y += 6
    } else if (line.startsWith('## ')) {
      if (y > 260) { doc.addPage(); y = margin + 4 }
      const text = line.slice(3)
      doc.setFillColor(...hex(LIGHT))
      doc.rect(margin, y - 4, contentW, 8, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...hex(BRAND))
      doc.text(text, margin + 3, y + 0.5)
      y += 7
    } else if (line.startsWith('# ')) {
      if (y > 255) { doc.addPage(); y = margin + 4 }
      const text = line.slice(2)
      doc.setFillColor(...hex(BRAND))
      doc.rect(margin, y - 5, contentW, 10, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(text, margin + 3, y + 1.5)
      y += 10
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.slice(2)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...hex(GRAY))
      const wrapped: string[] = doc.splitTextToSize(text, contentW - 10)
      doc.text('•', margin + 3, y)
      doc.text(wrapped, margin + 8, y)
      y += wrapped.length * 5 + 1
    } else if (/^\d+\.\s/.test(line)) {
      const text = line
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...hex(GRAY))
      const wrapped: string[] = doc.splitTextToSize(text, contentW - 6)
      doc.text(wrapped, margin + 3, y)
      y += wrapped.length * 5 + 1
    } else if (line.startsWith('**') && line.endsWith('**')) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...hex(BRAND))
      doc.text(line.replace(/\*\*/g, ''), margin + 3, y)
      y += 5.5
    } else {
      const text = line.replace(/\*\*/g, '')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...hex(GRAY))
      const wrapped: string[] = doc.splitTextToSize(text, contentW - 3)
      doc.text(wrapped, margin + 3, y)
      y += wrapped.length * 5 + 1
    }
  }

  // Footer
  const pageCount = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...hex(BRAND))
    doc.rect(0, 292, W, 8, 'F')
    doc.setTextColor(180, 210, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(opts.facilityName ? `${opts.facilityName} · ${opts.title}` : opts.title, margin, 297.5)
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 297.5, { align: 'right' })
  }

  const filename = `${opts.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

function sectionHeader(doc: any, title: string, x: number, y: number, w: number) {
  doc.setFillColor(...hex(ACCENT))
  doc.roundedRect(x, y, w, 8, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(title, x + 4, y + 5.5)
}

function tableRows(doc: any, rows: string[][], x: number, y: number, w: number, colWidths: number[]): number {
  let alt = false
  for (const row of rows) {
    doc.setFillColor(...hex(alt ? LIGHT : '#FFFFFF'))
    doc.rect(x, y, w, 7, 'F')
    doc.setFontSize(8.5)
    let colX = x + 3
    for (let i = 0; i < row.length; i++) {
      const isValue = i === 1
      const isNote = i === 2
      doc.setFont('helvetica', isValue ? 'bold' : 'normal')
      doc.setTextColor(...hex(isNote ? GRAY : isValue ? BRAND : GRAY))
      doc.text(row[i], colX, y + 4.8)
      colX += colWidths[i]
    }
    y += 7
    alt = !alt
  }
  return y
}
