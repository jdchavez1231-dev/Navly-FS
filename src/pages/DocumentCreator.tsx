import { useState, useRef, useEffect, useCallback } from 'react'
import {
  FileText, Plus, Trash2, Mic, MicOff, Bot, ChevronRight,
  ChevronDown, Loader2, Send, Download, Save, Sparkles, GripVertical,
  FileEdit, X
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type DocSection = {
  id: string
  title: string
  body: string
  level: 1 | 2
}

type FoodSafetyDoc = {
  id: string
  title: string
  type: string
  sections: DocSection[]
  createdAt: string
  updatedAt: string
}

type Template = {
  id: string
  name: string
  category: string
  description: string
  sections: Omit<DocSection, 'id'>[]
}

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'haccp-hazard',
    name: 'Hazard Analysis',
    category: 'HACCP Plan',
    description: 'Identify biological, chemical, and physical hazards at each process step',
    sections: [
      { title: 'Process Step Description', body: '', level: 1 },
      { title: 'Biological Hazards', body: '', level: 2 },
      { title: 'Chemical Hazards', body: '', level: 2 },
      { title: 'Physical Hazards', body: '', level: 2 },
      { title: 'Likelihood & Severity Assessment', body: '', level: 1 },
      { title: 'Control Measures', body: '', level: 1 },
    ],
  },
  {
    id: 'haccp-ccp',
    name: 'CCP Monitoring Procedure',
    category: 'HACCP Plan',
    description: 'Define critical limits, monitoring, corrective actions, and verification for a CCP',
    sections: [
      { title: 'CCP Identification & Hazard', body: '', level: 1 },
      { title: 'Critical Limits', body: '', level: 1 },
      { title: 'Monitoring Procedure', body: '', level: 1 },
      { title: 'Corrective Actions', body: '', level: 1 },
      { title: 'Verification Activities', body: '', level: 1 },
      { title: 'Records & Documentation', body: '', level: 1 },
    ],
  },
  {
    id: 'prp-sanitation',
    name: 'Sanitation Program',
    category: 'Prerequisite Programs',
    description: 'Cleaning and sanitizing procedures for equipment and facility areas',
    sections: [
      { title: 'Scope & Purpose', body: '', level: 1 },
      { title: 'Responsible Personnel', body: '', level: 1 },
      { title: 'Cleaning Chemicals & Concentrations', body: '', level: 1 },
      { title: 'Cleaning Procedures by Area', body: '', level: 1 },
      { title: 'Sanitation Schedule', body: '', level: 1 },
      { title: 'Verification & Monitoring', body: '', level: 1 },
      { title: 'Records', body: '', level: 1 },
    ],
  },
  {
    id: 'prp-pest',
    name: 'Pest Control Program',
    category: 'Prerequisite Programs',
    description: 'Preventive measures and response procedures for pest management',
    sections: [
      { title: 'Scope & Purpose', body: '', level: 1 },
      { title: 'Pest Control Provider Details', body: '', level: 1 },
      { title: 'Prevention Measures', body: '', level: 1 },
      { title: 'Monitoring Devices & Locations', body: '', level: 1 },
      { title: 'Inspection Schedule', body: '', level: 1 },
      { title: 'Corrective Actions', body: '', level: 1 },
      { title: 'Records & Reports', body: '', level: 1 },
    ],
  },
  {
    id: 'prp-allergen',
    name: 'Allergen Management Plan',
    category: 'Prerequisite Programs',
    description: 'Controls to prevent allergen cross-contact throughout the facility',
    sections: [
      { title: 'Allergens Present on Site', body: '', level: 1 },
      { title: 'Ingredient Receiving & Labeling', body: '', level: 1 },
      { title: 'Segregation & Storage', body: '', level: 1 },
      { title: 'Production Scheduling Controls', body: '', level: 1 },
      { title: 'Cleaning & Changeover Procedures', body: '', level: 1 },
      { title: 'Finished Product Labeling Review', body: '', level: 1 },
      { title: 'Training Requirements', body: '', level: 1 },
    ],
  },
  {
    id: 'prp-gmp',
    name: 'Good Manufacturing Practices',
    category: 'Prerequisite Programs',
    description: 'Personnel hygiene, facility, and equipment GMP requirements',
    sections: [
      { title: 'Personal Hygiene Requirements', body: '', level: 1 },
      { title: 'Protective Clothing & PPE', body: '', level: 1 },
      { title: 'Illness & Injury Reporting', body: '', level: 1 },
      { title: 'Visitor & Contractor Policy', body: '', level: 1 },
      { title: 'Facility Maintenance Standards', body: '', level: 1 },
      { title: 'Equipment Maintenance', body: '', level: 1 },
    ],
  },
  {
    id: 'team-meeting',
    name: 'Food Safety Team Meeting',
    category: 'Records',
    description: 'Agenda and minutes for food safety team meetings',
    sections: [
      { title: 'Meeting Details', body: '', level: 1 },
      { title: 'Attendees', body: '', level: 1 },
      { title: 'Agenda Items Discussed', body: '', level: 1 },
      { title: 'Action Items', body: '', level: 1 },
      { title: 'Next Meeting Date', body: '', level: 1 },
    ],
  },
  {
    id: 'training-record',
    name: 'Training Record',
    category: 'Records',
    description: 'Document employee food safety or GMP training sessions',
    sections: [
      { title: 'Training Topic & Objective', body: '', level: 1 },
      { title: 'Trainer Information', body: '', level: 1 },
      { title: 'Training Date & Location', body: '', level: 1 },
      { title: 'Training Content Summary', body: '', level: 1 },
      { title: 'Employee Roster & Sign-off', body: '', level: 1 },
      { title: 'Competency Assessment', body: '', level: 1 },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Custom',
    description: 'Start from scratch with a blank document',
    sections: [
      { title: 'Section 1', body: '', level: 1 },
    ],
  },
]

const CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)))

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function templateToDoc(template: Template, docTitle: string): FoodSafetyDoc {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: docTitle,
    type: template.id,
    sections: template.sections.map(s => ({ ...s, id: uid() })),
    createdAt: now,
    updatedAt: now,
  }
}

function loadDocs(): FoodSafetyDoc[] {
  try {
    return JSON.parse(localStorage.getItem('navly_docs') ?? '[]')
  } catch {
    return []
  }
}

function saveDocs(docs: FoodSafetyDoc[]) {
  localStorage.setItem('navly_docs', JSON.stringify(docs))
}

// ── Template Picker ───────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (t: Template, title: string) => void }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [title, setTitle] = useState('')
  const [chosen, setChosen] = useState<Template | null>(null)

  const visible = TEMPLATES.filter(t => t.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">New Document</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">Choose a template to get started</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category nav */}
        <div className="w-44 shrink-0 border-r border-gray-200 dark:border-gray-700 py-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setChosen(null) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {visible.map(t => (
              <button
                key={t.id}
                onClick={() => { setChosen(t); setTitle(t.name) }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  chosen?.id === t.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                }`}
              >
                <FileText className={`w-5 h-5 mb-2 ${chosen?.id === t.id ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`} />
                <div className={`text-sm font-medium mb-1 ${chosen?.id === t.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {t.name}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{t.description}</div>
              </button>
            ))}
          </div>

          {chosen && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Document title</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && title.trim() && onSelect(chosen, title.trim())}
                placeholder="Enter a title…"
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                disabled={!title.trim()}
                onClick={() => onSelect(chosen, title.trim())}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Create Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Document List Sidebar ─────────────────────────────────────────────────────

function DocListSidebar({
  docs,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  docs: FoodSafetyDoc[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="w-56 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Documents</span>
        <button
          onClick={onNew}
          className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          aria-label="New document"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {docs.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8 px-4">No documents yet. Click + to create one.</p>
        )}
        {docs.map(doc => (
          <div
            key={doc.id}
            className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
              activeId === doc.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
            onClick={() => onSelect(doc.id)}
          >
            <FileText className={`w-3.5 h-3.5 shrink-0 ${activeId === doc.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${activeId === doc.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {doc.title}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{TEMPLATES.find(t => t.id === doc.type)?.category ?? 'Custom'}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0"
              aria-label="Delete document"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Outline Panel ─────────────────────────────────────────────────────────────

function OutlinePanel({
  doc,
  activeSection,
  onJump,
}: {
  doc: FoodSafetyDoc
  activeSection: string | null
  onJump: (id: string) => void
}) {
  return (
    <div className="w-48 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Outline</span>
      </div>
      <div className="py-2">
        <div
          className="px-3 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => document.getElementById('doc-title-input')?.focus()}
        >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate block">{doc.title || 'Untitled'}</span>
        </div>
        {doc.sections.map((s, i) => (
          <div
            key={s.id}
            onClick={() => onJump(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${
              s.level === 2 ? 'pl-6' : ''
            } ${
              activeSection === s.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400'
            }`}
          >
            {s.level === 1
              ? <ChevronRight className="w-3 h-3 shrink-0" />
              : <span className="w-3 h-3 shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-600">–</span>
            }
            <span className="text-xs truncate">
              <span className="text-gray-400 dark:text-gray-600 mr-1">{i + 1}.</span>
              {s.title || 'Untitled section'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section Editor ─────────────────────────────────────────────────────────────

function SectionEditor({
  section,
  index,
  total,
  onUpdate,
  onDelete,
  onActivate,
  isActive,
}: {
  section: DocSection
  index: number
  total: number
  onUpdate: (patch: Partial<DocSection>) => void
  onDelete: () => void
  onActivate: () => void
  isActive: boolean
}) {
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const recognitionRef = useRef<any>(null)
  const supportsVoice = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim()
      onUpdate({ body: section.body ? section.body + ' ' + transcript : transcript })
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  async function generateContent() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `You are a food safety documentation expert. Write professional content for the "${section.title}" section of a food safety document. The existing content is: "${section.body || 'empty'}". Provide practical, ready-to-use text appropriate for BRCGS/HACCP food safety management. Keep it concise (150-250 words). Return only the content text, no headers.`,
          }],
        }),
      })
      const json = await res.json()
      const text = json.content?.[0]?.text ?? ''
      if (text) onUpdate({ body: section.body ? section.body + '\n\n' + text : text })
    } catch {
      // silent fail
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div
      id={`section-${section.id}`}
      onClick={onActivate}
      className={`rounded-xl border transition-all ${
        isActive
          ? 'border-blue-300 dark:border-blue-600 shadow-sm'
          : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-800 overflow-hidden`}
    >
      {/* Section header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${
        isActive ? 'border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
      }`}>
        <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
        <span className="text-xs text-gray-400 dark:text-gray-500 w-5 shrink-0 font-mono">{index + 1}.</span>
        <input
          value={section.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="Section title…"
          className={`flex-1 text-sm font-semibold bg-transparent border-0 outline-none focus:outline-none ${
            section.level === 2 ? 'text-gray-600 dark:text-gray-400 pl-3' : 'text-gray-800 dark:text-gray-100'
          } placeholder-gray-300 dark:placeholder-gray-600`}
        />
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onUpdate({ level: section.level === 1 ? 2 : 1 }) }}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 transition-colors"
            title={section.level === 1 ? 'Make subsection' : 'Make section'}
          >
            {section.level === 1 ? 'H1' : 'H2'}
          </button>
          {total > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
              aria-label="Delete section"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Section body */}
      <div className="px-4 py-3">
        <textarea
          ref={textareaRef}
          value={section.body}
          onChange={e => onUpdate({ body: e.target.value })}
          placeholder="Start typing, use voice dictation, or let AI generate content…"
          rows={4}
          className="w-full text-sm bg-transparent border-0 outline-none resize-none text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed"
        />
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50 dark:border-gray-700 mt-1">
          {supportsVoice && (
            <button
              onClick={e => { e.stopPropagation(); toggleDictation() }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                listening
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {listening ? 'Stop' : 'Dictate'}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); generateContent() }}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent transition-colors disabled:opacity-40"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {aiLoading ? 'Generating…' : 'AI Write'}
          </button>
          {listening && (
            <span className="text-xs text-red-500 flex items-center gap-1 ml-1">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              Listening…
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI Document Assistant ──────────────────────────────────────────────────────

type Msg = { role: 'user' | 'assistant'; content: string }

function AIAssistant({ doc, onApply }: { doc: FoodSafetyDoc; onApply: (text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `You are a food safety documentation assistant helping build a "${doc.title}" document (type: ${doc.type}). The document currently has these sections: ${doc.sections.map(s => s.title).join(', ')}. Help the user write, improve, or organize content. Be concise and practical.`,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const json = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: json.content?.[0]?.text ?? 'No response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching AI. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <Bot className="w-4 h-4 text-blue-500" />
        AI Document Assistant
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="h-52 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 && (
                <div className="text-center pt-6">
                  <Bot className="w-6 h-6 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ask me to improve a section, generate policy language, or suggest what to include</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-xs rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask AI to help write or improve…"
                className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Document Editor ───────────────────────────────────────────────────────

function DocEditor({ doc, onChange }: { doc: FoodSafetyDoc; onChange: (d: FoodSafetyDoc) => void }) {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  function updateTitle(title: string) {
    onChange({ ...doc, title, updatedAt: new Date().toISOString() })
  }

  function updateSection(id: string, patch: Partial<DocSection>) {
    onChange({
      ...doc,
      sections: doc.sections.map(s => s.id === id ? { ...s, ...patch } : s),
      updatedAt: new Date().toISOString(),
    })
  }

  function addSection() {
    const newSection: DocSection = { id: uid(), title: '', body: '', level: 1 }
    onChange({ ...doc, sections: [...doc.sections, newSection], updatedAt: new Date().toISOString() })
    setActiveSection(newSection.id)
    setTimeout(() => document.getElementById(`section-${newSection.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  function deleteSection(id: string) {
    onChange({ ...doc, sections: doc.sections.filter(s => s.id !== id), updatedAt: new Date().toISOString() })
    if (activeSection === id) setActiveSection(null)
  }

  function jumpTo(id: string) {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function exportText() {
    const lines = [`# ${doc.title}\n`]
    doc.sections.forEach((s, i) => {
      lines.push(`${s.level === 1 ? '##' : '###'} ${i + 1}. ${s.title}`)
      if (s.body) lines.push(s.body)
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${doc.title}.txt` })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 flex items-center gap-3">
          <FileEdit className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            id="doc-title-input"
            value={doc.title}
            onChange={e => updateTitle(e.target.value)}
            placeholder="Document title…"
            className="flex-1 text-base font-semibold bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {TEMPLATES.find(t => t.id === doc.type)?.category ?? 'Custom'}
          </span>
          <button
            onClick={exportText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {doc.sections.map((s, i) => (
            <SectionEditor
              key={s.id}
              section={s}
              index={i}
              total={doc.sections.length}
              isActive={activeSection === s.id}
              onActivate={() => setActiveSection(s.id)}
              onUpdate={patch => updateSection(s.id, patch)}
              onDelete={() => deleteSection(s.id)}
            />
          ))}
          <button
            onClick={addSection}
            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add section
          </button>
        </div>

        {/* AI assistant */}
        <AIAssistant doc={doc} onApply={() => {}} />
      </div>

      {/* Outline */}
      <OutlinePanel doc={doc} activeSection={activeSection} onJump={jumpTo} />
    </div>
  )
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function DocumentCreator() {
  const [docs, setDocs] = useState<FoodSafetyDoc[]>(loadDocs)
  const [activeId, setActiveId] = useState<string | null>(docs[0]?.id ?? null)
  const [showPicker, setShowPicker] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { document.title = 'Document Creator — Navly FS' }, [])

  const activeDoc = docs.find(d => d.id === activeId) ?? null

  function handleDocChange(updated: FoodSafetyDoc) {
    const next = docs.map(d => d.id === updated.id ? updated : d)
    setDocs(next)
    saveDocs(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleCreate(template: Template, title: string) {
    const doc = templateToDoc(template, title)
    const next = [doc, ...docs]
    setDocs(next)
    saveDocs(next)
    setActiveId(doc.id)
    setShowPicker(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    const next = docs.filter(d => d.id !== id)
    setDocs(next)
    saveDocs(next)
    setActiveId(next[0]?.id ?? null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Document list */}
      <DocListSidebar
        docs={docs}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setShowPicker(true)}
        onDelete={handleDelete}
      />

      {/* Main area */}
      {showPicker ? (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-900">
          <TemplatePicker onSelect={handleCreate} />
        </div>
      ) : activeDoc ? (
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 relative">
          {saved && (
            <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow">
              <Save className="w-3 h-3" /> Saved
            </div>
          )}
          <DocEditor doc={activeDoc} onChange={handleDocChange} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
          <FileText className="w-12 h-12 text-gray-200 dark:text-gray-700" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No documents yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Create a HACCP plan, PRP record, or any food safety document</p>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>
      )}
    </div>
  )
}
