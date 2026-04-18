import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Upload, X, Loader2, Send, Bot, Video, File, BookOpen, RefreshCw, CheckSquare, Square } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CorrectiveActionCard } from './CorrectiveActionCard'
import type { BrcgsClause, ClauseRecord, EvidenceItem, CorrectiveAction } from '../types'

type Message = { role: 'user' | 'assistant'; content: string }
type Tab = 'notes' | 'evidence' | 'ai' | 'guide'

interface AuditGuide {
  look_for: string[]
  evidence_required: string[]
  common_nonconformances: string[]
}

interface Props {
  clause: BrcgsClause
  record: ClauseRecord
  facilityId: string
  onUpdateNotes: (notes: string) => void
  onAddEvidence: (item: EvidenceItem) => void
  onRemoveEvidence: (url: string) => void
  correctiveAction?: CorrectiveAction
  onUpdateCA?: (id: string, patch: Partial<CorrectiveAction>) => void
}

const SUGGESTED_QUESTIONS = [
  'What evidence do I need?',
  'What does this clause require?',
  'How do I demonstrate compliance?',
]

export function ClausePanel({
  clause,
  record,
  facilityId,
  onUpdateNotes,
  onAddEvidence,
  onRemoveEvidence,
  correctiveAction,
  onUpdateCA,
}: Props) {
  const hasGap = record.status === 'gap'
  const [activeTab, setActiveTab] = useState<Tab>('notes')

  // Voice dictation
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const supportsVoice = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition

  // Evidence upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI chat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Audit guide
  const [guide, setGuide] = useState<AuditGuide | null>(null)
  const [guideLoading, setGuideLoading] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  // Sync notes → CA description whenever notes change and a CA exists
  function handleNotesChange(notes: string) {
    onUpdateNotes(notes)
    if (correctiveAction && onUpdateCA) {
      onUpdateCA(correctiveAction.id, { description: notes })
    }
  }

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
      handleNotesChange(record.notes ? record.notes + ' ' + transcript : transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  async function handleEvidenceFiles(files: FileList | null) {
    if (!files || !facilityId) return
    setUploadError('')
    setUploading(true)
    for (const file of Array.from(files)) {
      const path = `${facilityId}/${clause.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('clause-evidence').upload(path, file)
      if (error) { setUploadError('Upload failed — check the clause-evidence storage bucket exists.'); break }
      const { data: urlData } = supabase.storage.from('clause-evidence').getPublicUrl(path)
      const type: EvidenceItem['type'] = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file'
      onAddEvidence({ url: urlData.publicUrl, name: file.name, type, createdAt: new Date().toISOString() })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeEvidence(item: EvidenceItem) {
    const pathPart = item.url.split('/clause-evidence/')[1]
    if (pathPart) await supabase.storage.from('clause-evidence').remove([pathPart])
    onRemoveEvidence(item.url)
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || aiLoading) return
    const userMsg: Message = { role: 'user', content }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setAiLoading(true)
    const ratingLabel = clause.rating === 'fundamental' ? 'Fundamental — automatic failure' : clause.rating === 'major' ? 'Major' : 'Minor'
    const system = `You are a BRCGS Food Safety Issue 9 auditor assistant.
Clause ${clause.id}: "${clause.title}" (${ratingLabel})
Requirement: ${clause.description}
Current status: ${record.status}
Current notes: ${record.notes || 'None'}
Be concise and practical.`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system, messages: next.map(m => ({ role: m.role, content: m.content })) }),
      })
      const json = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: json.content?.[0]?.text ?? 'No response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching AI. Please try again.' }])
    } finally {
      setAiLoading(false)
    }
  }

  async function loadGuide() {
    setGuideLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are a BRCGS Food Safety Issue 9 lead auditor. Generate a practical audit guide for clause ${clause.id}: "${clause.title}".

Requirement: ${clause.description}
Severity: ${clause.rating}

Return ONLY valid JSON with exactly these fields:
{
  "look_for": ["5-8 specific things to observe or verify during the audit"],
  "evidence_required": ["4-6 documents or records typically needed for this clause"],
  "common_nonconformances": ["4-6 common failures found for this clause"]
}

Be specific to BRCGS Issue 9. No markdown, no extra text.`
          }],
        }),
      })
      const json = await res.json()
      const text = (json.content?.[0]?.text ?? '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      setGuide(JSON.parse(text))
      setChecked({})
    } catch {
      // leave guide null
    } finally {
      setGuideLoading(false)
    }
  }

  function toggleCheck(key: string) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const evidence = record.evidence ?? []

  const TABS: { id: Tab; label: string }[] = [
    { id: 'notes', label: hasGap ? 'Non-conformance' : 'Notes' },
    { id: 'evidence', label: `Evidence${evidence.length > 0 ? ` (${evidence.length})` : ''}` },
    { id: 'ai', label: 'Ask AI' },
    { id: 'guide', label: 'Audit Guide' },
  ]

  return (
    <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 mb-3 leading-relaxed">{clause.description}</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'guide' && !guide && !guideLoading) loadGuide()
            }}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id ? 'text-blue-700 dark:text-blue-400 border-blue-600' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notes / Non-conformance tab */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {hasGap ? 'Describe the non-conformance observed' : 'Notes & evidence references'}
            </span>
            {supportsVoice && (
              <button
                onClick={toggleDictation}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  listening ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {listening ? 'Stop' : 'Dictate'}
              </button>
            )}
          </div>

          {hasGap && (
            <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-1.5 mb-2">
              This description will be used as the non-conformance finding in the CAPA.
            </p>
          )}

          <textarea
            placeholder={hasGap
              ? 'Describe what was observed, where, and any immediate impact…'
              : 'Notes, evidence references, action items, responsible person…'
            }
            value={record.notes ?? ''}
            onChange={e => handleNotesChange(e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-md p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            rows={4}
          />
          {listening && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping" />
              Listening… speak now
            </p>
          )}
          {record.updatedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Last updated {new Date(record.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          {correctiveAction && onUpdateCA && (
            <CorrectiveActionCard action={correctiveAction} onUpdate={onUpdateCA} />
          )}
        </div>
      )}

      {/* Evidence tab */}
      {activeTab === 'evidence' && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.docx" multiple className="hidden"
            onChange={e => handleEvidenceFiles(e.target.files)} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-5 text-center hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50 mb-3">
            {uploading
              ? <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-xs"><Loader2 className="w-4 h-4 animate-spin" />Uploading…</div>
              : <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-xs"><Upload className="w-4 h-4" />Upload photos, videos, or documents</div>
            }
          </button>
          {uploadError && <p className="text-xs text-red-500 mb-3">{uploadError}</p>}
          {evidence.length === 0
            ? <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No evidence attached yet</p>
            : <div className="grid grid-cols-3 gap-2">
                {evidence.map(item => (
                  <div key={item.url} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    {item.type === 'image'
                      ? <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.name} className="w-full h-20 object-cover" /></a>
                      : <a href={item.url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-20 gap-1.5 px-2">
                          {item.type === 'video' ? <Video className="w-5 h-5 text-gray-400 shrink-0" /> : <File className="w-5 h-5 text-gray-400 shrink-0" />}
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">{item.name}</span>
                        </a>
                    }
                    <button onClick={() => removeEvidence(item)}
                      aria-label={`Remove ${item.name}`}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Ask AI tab */}
      {activeTab === 'ai' && (
        <div className="flex flex-col" style={{ height: 280 }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 pr-1">
            {messages.length === 0
              ? <div className="text-center pt-4">
                  <Bot className="w-7 h-7 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Ask about requirements, evidence, or how to achieve compliance</p>
                  <div className="space-y-1.5">
                    {SUGGESTED_QUESTIONS.map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="block w-full text-xs text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              : messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] text-xs rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                      {m.content}
                    </div>
                  </div>
                ))
            }
            {aiLoading && <div className="flex justify-start"><div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2"><Loader2 className="w-3 h-3 animate-spin text-gray-400" /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask a question…"
              className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
            <button onClick={() => sendMessage()} disabled={!input.trim() || aiLoading}
              aria-label="Send message"
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0">
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Audit Guide tab */}
      {activeTab === 'guide' && (
        <div>
          {guideLoading && (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-gray-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Generating audit guide…
            </div>
          )}

          {!guideLoading && !guide && (
            <div className="text-center py-8">
              <BookOpen className="w-7 h-7 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Get AI-generated auditing guidance for this clause</p>
              <button onClick={loadGuide}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Generate Audit Guide
              </button>
            </div>
          )}

          {!guideLoading && guide && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">AI-generated guidance for clause {clause.id}</p>
                <button onClick={loadGuide} className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <RefreshCw className="w-3 h-3" />Regenerate
                </button>
              </div>

              <GuideSection
                title="Things to look for"
                color="blue"
                items={guide.look_for}
                checked={checked}
                prefix="look"
                onToggle={toggleCheck}
                checkable
              />
              <GuideSection
                title="Evidence required"
                color="green"
                items={guide.evidence_required}
                checked={checked}
                prefix="ev"
                onToggle={toggleCheck}
                checkable
              />
              <GuideSection
                title="Common non-conformances"
                color="red"
                items={guide.common_nonconformances}
                checked={checked}
                prefix="nc"
                onToggle={toggleCheck}
                checkable={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GuideSection({
  title, color, items, checked, prefix, onToggle, checkable
}: {
  title: string
  color: 'blue' | 'green' | 'red'
  items: string[]
  checked: Record<string, boolean>
  prefix: string
  onToggle: (k: string) => void
  checkable: boolean
}) {
  const headerColor = {
    blue: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }[color]
  const checkColor = { blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-400' }[color]

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className={`px-3 py-2 text-xs font-semibold border-b ${headerColor}`}>{title}</div>
      <ul className="divide-y divide-gray-50 dark:divide-gray-700">
        {items.map((item, i) => {
          const key = `${prefix}-${i}`
          const done = checked[key]
          return (
            <li key={key}
              className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors ${checkable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} ${done ? 'opacity-50' : ''}`}
              onClick={() => checkable && onToggle(key)}
            >
              {checkable
                ? done
                  ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${checkColor}`} />
                  : <Square className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-300 dark:text-gray-600" />
                : <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
              }
              <span className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed ${done ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{item}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
