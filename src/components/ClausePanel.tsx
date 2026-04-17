import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Upload, X, Loader2, Send, Bot, Video, File } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { BrcgsClause, ClauseRecord, EvidenceItem } from '../types'

type Message = { role: 'user' | 'assistant'; content: string }

interface Props {
  clause: BrcgsClause
  record: ClauseRecord
  facilityId: string
  onUpdateNotes: (notes: string) => void
  onAddEvidence: (item: EvidenceItem) => void
  onRemoveEvidence: (url: string) => void
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
}: Props) {
  const [activeTab, setActiveTab] = useState<'notes' | 'evidence' | 'ai'>('notes')

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Stop dictation if clause collapses
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
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
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .trim()
      onUpdateNotes(record.notes ? record.notes + ' ' + transcript : transcript)
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
      if (error) {
        setUploadError('Upload failed — check the clause-evidence storage bucket exists.')
        break
      }
      const { data: urlData } = supabase.storage.from('clause-evidence').getPublicUrl(path)
      const type: EvidenceItem['type'] = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'file'
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

    const ratingLabel =
      clause.rating === 'fundamental'
        ? 'Fundamental — automatic failure if non-conformant'
        : clause.rating === 'major'
        ? 'Major non-conformance'
        : 'Minor non-conformance'

    const system = `You are a BRCGS Food Safety Issue 9 auditor assistant helping a food facility prepare for their audit.

Clause ${clause.id}: "${clause.title}"
Rating: ${ratingLabel}
Requirement: ${clause.description}

Current status: ${record.status}
Current notes: ${record.notes || 'None'}

Give practical, specific, actionable guidance. Be concise. Focus on what the facility needs to do or document to achieve compliance.`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const json = await res.json()
      const reply = json.content?.[0]?.text ?? 'Sorry, no response received.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching AI. Please try again.' }])
    } finally {
      setAiLoading(false)
    }
  }

  const evidence = record.evidence ?? []

  return (
    <div className="px-4 pb-4 border-t border-gray-100">
      {/* Description */}
      <p className="text-sm text-gray-500 mt-3 mb-3 leading-relaxed">{clause.description}</p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 mb-4">
        {(['notes', 'evidence', 'ai'] as const).map(tab => {
          const label =
            tab === 'ai' ? 'Ask AI' : tab === 'evidence' ? `Evidence${evidence.length > 0 ? ` (${evidence.length})` : ''}` : 'Notes'
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-blue-700 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Notes &amp; evidence references</span>
            {supportsVoice && (
              <button
                onClick={toggleDictation}
                title={listening ? 'Stop dictation' : 'Dictate notes'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  listening
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {listening ? 'Stop' : 'Dictate'}
              </button>
            )}
          </div>
          <textarea
            placeholder="Notes, evidence references, action items, responsible person…"
            value={record.notes ?? ''}
            onChange={e => onUpdateNotes(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-md p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
            rows={4}
          />
          {listening && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping" />
              Listening… speak now
            </p>
          )}
          {record.updatedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated{' '}
              {new Date(record.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Evidence tab */}
      {activeTab === 'evidence' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.docx"
            multiple
            className="hidden"
            onChange={e => handleEvidenceFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 mb-3"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Upload className="w-4 h-4" />
                Upload photos, videos, or documents
              </div>
            )}
          </button>

          {uploadError && (
            <p className="text-xs text-red-500 mb-3">{uploadError}</p>
          )}

          {evidence.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No evidence attached yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {evidence.map(item => (
                <div
                  key={item.url}
                  className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {item.type === 'image' ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <img src={item.url} alt={item.name} className="w-full h-20 object-cover" />
                    </a>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center h-20 gap-1.5 px-2"
                    >
                      {item.type === 'video' ? (
                        <Video className="w-5 h-5 text-gray-400 shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className="text-xs text-gray-500 truncate w-full text-center">{item.name}</span>
                    </a>
                  )}
                  <button
                    onClick={() => removeEvidence(item)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI tab */}
      {activeTab === 'ai' && (
        <div className="flex flex-col" style={{ height: 280 }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0 pr-1">
            {messages.length === 0 ? (
              <div className="text-center pt-4">
                <Bot className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-3">
                  Ask about requirements, evidence, or how to achieve compliance
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-xs text-left px-3 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-gray-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] text-xs rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask a question…"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || aiLoading}
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
