import { useEffect, useState } from 'react'
import { Building2, Users, CreditCard, Save, Loader2, Mail, Trash2, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useFacility } from '../hooks/useFacility'
import { useAuth } from '../lib/AuthContext'

type Tab = 'facility' | 'team' | 'billing'

type Facility = {
  id: string
  name: string
  regulatory_body: string
  active_standard: string
  audit_date: string | null
  subscription_status: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

type TeamMember = {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

// ── Facility Profile ─────────────────────────────────────────────────────────

function FacilityTab({ facilityId }: { facilityId: string }) {
  const [form, setForm] = useState<Facility | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showStandardConfirm, setShowStandardConfirm] = useState(false)
  const [pendingStandard, setPendingStandard] = useState('')

  useEffect(() => {
    supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single()
      .then(({ data }) => {
        if (data) setForm({
          ...(data as Facility),
          address: (data as any).address ?? '',
          city: (data as any).city ?? '',
          state: (data as any).state ?? '',
          country: (data as any).country ?? '',
          postal_code: (data as any).postal_code ?? '',
          contact_name: (data as any).contact_name ?? '',
          contact_email: (data as any).contact_email ?? '',
          contact_phone: (data as any).contact_phone ?? '',
        })
      })
  }, [facilityId])

  function handleStandardChange(val: string) {
    if (!form || val === form.active_standard) return
    setPendingStandard(val)
    setShowStandardConfirm(true)
  }

  async function confirmStandardChange() {
    if (!form) return
    setForm(prev => prev ? { ...prev, active_standard: pendingStandard } : prev)
    setShowStandardConfirm(false)
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('facilities')
      .update({
        name: form.name,
        regulatory_body: form.regulatory_body,
        active_standard: form.active_standard,
        audit_date: form.audit_date || null,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        postal_code: form.postal_code,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
      })
      .eq('id', facilityId)
    setSaving(false)
    if (err) { setError('Failed to save. Please try again.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!form) return (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>
  )

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Facility name</label>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Regulatory body</label>
        <select
          value={form.regulatory_body}
          onChange={e => setForm({ ...form, regulatory_body: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USDA">USDA</option>
          <option value="FDA">FDA</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Active standard</label>
        <select
          value={form.active_standard}
          onChange={e => handleStandardChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="BRCGS">BRCGS</option>
          <option value="SQF">SQF Edition 9</option>
          <option value="FSSC22000">FSSC 22000</option>
          <option value="Custom">Custom</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">Changing this will reload your checklist for the new standard.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Next audit date</label>
        <input
          type="date"
          value={form.audit_date ?? ''}
          onChange={e => setForm({ ...form, audit_date: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Address</p>
        <div className="space-y-4">
          <Field label="Street address" value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="123 Main St" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} placeholder="City" />
            <Field label="State / Province" value={form.state} onChange={v => setForm({ ...form, state: v })} placeholder="State" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} placeholder="Country" />
            <Field label="Postal code" value={form.postal_code} onChange={v => setForm({ ...form, postal_code: v })} placeholder="ZIP / Postal" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Primary Contact</p>
        <div className="space-y-4">
          <Field label="Contact name" value={form.contact_name} onChange={v => setForm({ ...form, contact_name: v })} placeholder="Quality Manager name" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.contact_email} onChange={v => setForm({ ...form, contact_email: v })} placeholder="qm@company.com" />
            <Field label="Phone" value={form.contact_phone} onChange={v => setForm({ ...form, contact_phone: v })} placeholder="+1 555 000 0000" />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
      </button>

      {/* Standard change confirmation modal */}
      {showStandardConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Switch standard?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Switching to <span className="font-medium text-gray-800">{pendingStandard}</span> will update your active standard. Your existing checklist data will remain but you may need to re-seed items for the new standard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStandardConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStandardChange}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

// ── Team & Users ──────────────────────────────────────────────────────────────

function TeamTab({ facilityId }: { facilityId: string }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => { loadMembers() }, [facilityId])

  async function loadMembers() {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('facility_id', facilityId)
    if (data) setMembers(data as TeamMember[])
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteError('')
    setInviting(true)

    const { error: insertError } = await supabase.from('users').insert({
      facility_id: facilityId,
      email: inviteEmail.trim(),
      role: 'viewer',
    })

    setInviting(false)
    if (insertError) {
      setInviteError('Could not add user. They may already be a member.')
      return
    }
    setInviteEmail('')
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 3000)
    loadMembers()
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    await supabase.from('users').update({ role: newRole }).eq('id', memberId)
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  async function handleRemove(memberId: string) {
    if (memberId === user?.id) return
    if (!confirm('Remove this user from the facility?')) return
    await supabase.from('users').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Member list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No team members yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                  {(m.full_name ?? m.email ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.full_name ?? m.email ?? 'Unknown'}</p>
                  {m.full_name && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                </div>
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  disabled={m.id === user?.id}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                {m.id === user?.id ? (
                  <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                ) : (
                  <button onClick={() => handleRemove(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Invite by email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="colleague@company.com"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Invite
          </button>
        </div>
        {inviteError && <p className="text-xs text-red-600 mt-1.5">{inviteError}</p>}
        {inviteSent && <p className="text-xs text-green-600 mt-1.5">User added to facility.</p>}
      </div>
    </div>
  )
}

// ── Billing ───────────────────────────────────────────────────────────────────

function BillingTab({ facilityId }: { facilityId: string }) {
  const [status, setStatus] = useState<string>('free')

  useEffect(() => {
    supabase
      .from('facilities')
      .select('subscription_status')
      .eq('id', facilityId)
      .single()
      .then(({ data }) => { if (data) setStatus(data.subscription_status) })
  }, [facilityId])

  const isPro = status === 'active'

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{isPro ? 'Navly Pro' : 'Free Plan'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPro ? 'Full access to all features' : 'Limited to 1 user and 3 SOP uploads'}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPro ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isPro ? 'Active' : 'Free'}
          </span>
        </div>

        {!isPro && (
          <button
            disabled
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed"
          >
            Upgrade to Pro — coming soon
          </button>
        )}

        {isPro && (
          <button
            disabled
            className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed"
          >
            Manage subscription — coming soon
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs text-blue-700 font-medium mb-1">Stripe billing coming in Stage 10</p>
        <p className="text-xs text-blue-600">
          Full subscription management, plan upgrades, and payment history will be available after Stripe integration is complete.
        </p>
      </div>
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'facility' as Tab, label: 'Facility', icon: Building2 },
  { id: 'team' as Tab, label: 'Team', icon: Users },
  { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
]

export default function Settings() {
  const { facilityId, loading } = useFacility()
  const [tab, setTab] = useState<Tab>('facility')

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>
  )

  if (!facilityId) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      No facility found.
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your facility, team, and billing</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'facility' && <FacilityTab facilityId={facilityId} />}
        {tab === 'team' && <TeamTab facilityId={facilityId} />}
        {tab === 'billing' && <BillingTab facilityId={facilityId} />}
      </div>
    </div>
  )
}
