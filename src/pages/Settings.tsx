import { useEffect, useState } from 'react'
import {
  Building2, Users, CreditCard, Save, Loader2, Mail, Trash2, Crown,
  Sun, Moon, Monitor, CheckSquare, Square, Sparkles, ShieldCheck,
  ChevronRight, AlertTriangle, Bell, Key
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useFacility } from '../hooks/useFacility'
import { useAuth } from '../lib/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import { loadFacilityProfile, saveFacilityProfile } from './Onboarding'
import type { FacilityProfile } from './Onboarding'

type Tab = 'facility' | 'team' | 'appearance' | 'billing' | 'notifications' | 'account'

type FacilityData = {
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

const FACILITY_TYPES = [
  'Bakery / Confectionery', 'Meat & Poultry Processing', 'Dairy Processing',
  'Fresh Produce / Fruits & Veg', 'Seafood Processing', 'Beverage Manufacturing',
  'Ready-to-Eat Foods', 'Dry Goods / Grains / Cereals', 'Frozen Foods / Cold Chain',
  'Snack Foods', 'Sauces, Condiments & Dressings', 'Other Food Manufacturing',
]

const ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Dairy / Milk', 'Eggs',
  'Wheat / Gluten', 'Soy', 'Fish', 'Shellfish',
  'Sesame', 'Mustard', 'Sulphites',
]

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
const cardCls = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5'
const sectionLabelCls = 'text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4'

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

// ── Facility Tab ──────────────────────────────────────────────────────────────

function FacilityTab({ facilityId }: { facilityId: string }) {
  const [form, setForm] = useState<FacilityData | null>(null)
  const [profile, setProfile] = useState<FacilityProfile>(() => loadFacilityProfile() ?? {
    facilityType: '', employeeCount: '', allergens: [], products: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showStandardConfirm, setShowStandardConfirm] = useState(false)
  const [pendingStandard, setPendingStandard] = useState('')

  useEffect(() => {
    supabase.from('facilities').select('*').eq('id', facilityId).single()
      .then(({ data }) => {
        if (data) setForm({
          ...(data as FacilityData),
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

  function toggleAllergen(a: string) {
    setProfile(p => ({
      ...p,
      allergens: p.allergens.includes(a) ? p.allergens.filter(x => x !== a) : [...p.allergens, a],
    }))
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError('')
    saveFacilityProfile(profile)
    const { error: err } = await supabase.from('facilities').update({
      name: form.name,
      regulatory_body: form.regulatory_body,
      active_standard: form.active_standard,
      audit_date: form.audit_date || null,
      address: form.address, city: form.city, state: form.state,
      country: form.country, postal_code: form.postal_code,
      contact_name: form.contact_name, contact_email: form.contact_email,
      contact_phone: form.contact_phone,
    }).eq('id', facilityId)
    setSaving(false)
    if (err) { setError('Failed to save. Please try again.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!form) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />Loading…
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Core identity */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Facility profile</p>
        <div className="space-y-4">
          <Field label="Facility name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Your facility name" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Facility type</label>
              <select value={profile.facilityType} onChange={e => setProfile(p => ({ ...p, facilityType: e.target.value }))} className={inputCls}>
                <option value="">Select type…</option>
                {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Main products" value={profile.products} onChange={v => setProfile(p => ({ ...p, products: v }))} placeholder="e.g. bread, cookies" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Regulatory body</label>
              <select value={form.regulatory_body} onChange={e => setForm({ ...form, regulatory_body: e.target.value })} className={inputCls}>
                <option value="FDA">FDA</option>
                <option value="USDA">USDA</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Active standard</label>
              <select value={form.active_standard} onChange={e => {
                if (e.target.value !== form.active_standard) { setPendingStandard(e.target.value); setShowStandardConfirm(true) }
              }} className={inputCls}>
                <option value="BRCGS">BRCGS Issue 9</option>
                <option value="SQF">SQF Edition 9</option>
                <option value="FSSC22000">FSSC 22000</option>
                <option value="Custom">Custom</option>
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Changing this reloads your compliance checklist.</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Next audit date</label>
            <input type="date" value={form.audit_date ?? ''} onChange={e => setForm({ ...form, audit_date: e.target.value })} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Allergens */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Allergens on site</p>
        <div className="grid grid-cols-3 gap-2">
          {ALLERGENS.map(a => {
            const checked = profile.allergens.includes(a)
            return (
              <button key={a} onClick={() => toggleAllergen(a)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-sm ${
                  checked
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {checked
                  ? <CheckSquare className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  : <Square className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                }
                {a}
              </button>
            )
          })}
        </div>
      </div>

      {/* Address */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Address</p>
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

      {/* Contact */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Primary contact</p>
        <div className="space-y-4">
          <Field label="Contact name" value={form.contact_name} onChange={v => setForm({ ...form, contact_name: v })} placeholder="Quality Manager" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.contact_email} onChange={v => setForm({ ...form, contact_email: v })} placeholder="qm@company.com" type="email" />
            <Field label="Phone" value={form.contact_phone} onChange={v => setForm({ ...form, contact_phone: v })} placeholder="+1 555 000 0000" type="tel" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save changes'}
      </button>

      {showStandardConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Switch standard?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Switching to <span className="font-medium text-gray-800 dark:text-gray-200">{pendingStandard}</span> will update your active standard. Your existing checklist data remains but you may need to re-assess items for the new standard.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowStandardConfirm(false)}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={() => { setForm(f => f ? { ...f, active_standard: pendingStandard } : f); setShowStandardConfirm(false) }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  admin:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  viewer: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
}

function TeamTab({ facilityId }: { facilityId: string }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => { loadMembers() }, [facilityId])

  async function loadMembers() {
    const { data } = await supabase.from('users').select('id, full_name, email, role').eq('facility_id', facilityId)
    if (data) setMembers(data as TeamMember[])
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteError(''); setInviting(true)
    const { error } = await supabase.from('users').insert({ facility_id: facilityId, email: inviteEmail.trim(), role: 'viewer' })
    setInviting(false)
    if (error) { setInviteError('Could not add user. They may already be a member.'); return }
    setInviteEmail(''); setInviteSent(true)
    setTimeout(() => setInviteSent(false), 3000)
    loadMembers()
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    await supabase.from('users').update({ role: newRole }).eq('id', memberId)
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  async function handleRemove(memberId: string) {
    if (memberId === user?.id || !confirm('Remove this user?')) return
    await supabase.from('users').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  return (
    <div className="space-y-5">
      <div className={cardCls}>
        <p className={sectionLabelCls}>Team members — {members.length}</p>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700 -mx-5">
            {members.map(m => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                  {(m.full_name ?? m.email ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {m.full_name ?? m.email ?? 'Unknown'}
                    {m.id === user?.id && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">you</span>}
                  </p>
                  {m.full_name && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.viewer}`}>
                  {m.role}
                </span>
                {m.id !== user?.id && (
                  <>
                    <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => handleRemove(m.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {m.id === user?.id && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cardCls}>
        <p className={sectionLabelCls}>Invite team member</p>
        <div className="flex gap-2">
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="colleague@company.com" className={inputCls} />
          <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Invite
          </button>
        </div>
        {inviteError && <p className="text-xs text-red-600 mt-2">{inviteError}</p>}
        {inviteSent && <p className="text-xs text-green-600 mt-2">✓ User added to facility.</p>}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Invited users will have viewer access by default. You can change their role after adding.</p>
      </div>
    </div>
  )
}

// ── Appearance Tab ────────────────────────────────────────────────────────────

function AppearanceTab() {
  const { dark, toggle } = useDarkMode()

  const themes = [
    { id: 'light', label: 'Light',  icon: Sun,     active: !dark },
    { id: 'dark',  label: 'Dark',   icon: Moon,    active: dark },
    { id: 'system', label: 'System', icon: Monitor, active: false },
  ]

  return (
    <div className="space-y-5">
      <div className={cardCls}>
        <p className={sectionLabelCls}>Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(t => {
            const Icon = t.icon
            const isActive = t.id === 'dark' ? dark : t.id === 'light' ? !dark : false
            return (
              <button key={t.id} onClick={() => {
                if (t.id === 'dark' && !dark) toggle()
                if (t.id === 'light' && dark) toggle()
                if (t.id === 'system') {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  if (prefersDark !== dark) toggle()
                }
              }}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {t.label}
                </span>
                {isActive && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className={cardCls}>
        <p className={sectionLabelCls}>Display</p>
        <div className="space-y-4">
          {[
            { label: 'Compact density', desc: 'Reduce spacing to fit more content on screen', soon: true },
            { label: 'Reduce animations', desc: 'Minimize motion for accessibility', soon: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.soon && <span className="text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">Soon</span>}
                <div className="w-10 h-5 rounded-full bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Billing Tab ───────────────────────────────────────────────────────────────

const FEATURES = [
  { label: 'BRCGS compliance tracker',     free: true,  pro: true },
  { label: 'SOP uploads',                  free: '3',   pro: 'Unlimited' },
  { label: 'AI SOP builder',               free: true,  pro: true },
  { label: 'AI CAPA suggestions',          free: true,  pro: true },
  { label: 'Document creator + PDF export',free: true,  pro: true },
  { label: 'Team members',                 free: '1',   pro: 'Unlimited' },
  { label: 'Audit readiness PDF report',   free: false, pro: true },
  { label: 'Custom standards (SQF, FSSC)', free: false, pro: true },
  { label: 'Priority support',             free: false, pro: true },
]

function BillingTab({ facilityId }: { facilityId: string }) {
  const [status, setStatus] = useState('free')

  useEffect(() => {
    supabase.from('facilities').select('subscription_status').eq('id', facilityId).single()
      .then(({ data }) => { if (data) setStatus(data.subscription_status) })
  }, [facilityId])

  const isPro = status === 'active'

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{isPro ? 'Navly Pro' : 'Free Plan'}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {isPro ? 'Full access — all features unlocked' : 'Limited access — upgrade to unlock everything'}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            isPro ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {isPro ? '✓ Active' : 'Free'}
          </span>
        </div>
        <button disabled
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors opacity-60 cursor-not-allowed ${
            isPro
              ? 'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              : 'bg-blue-600 text-white'
          }`}>
          {isPro ? 'Manage subscription — coming soon' : 'Upgrade to Pro — coming soon'}
        </button>
      </div>

      {/* Feature comparison */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Plan comparison</p>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Feature</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Free</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {FEATURES.map(f => (
                <tr key={f.label} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{f.label}</td>
                  <td className="px-4 py-3 text-center">
                    {f.free === true
                      ? <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                      : f.free === false
                        ? <span className="text-gray-300 dark:text-gray-600">—</span>
                        : <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{f.free}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.pro === true
                      ? <ShieldCheck className="w-4 h-4 text-blue-500 mx-auto" />
                      : <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{f.pro}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-0.5">Stripe integration coming soon</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Full subscription management, billing history, and plan upgrades will be available in the next release.</p>
        </div>
      </div>
    </div>
  )
}

// ── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ label, desc, checked, onToggle }: {
  label: string; desc: string; checked: boolean; onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={checked}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

type NotifPrefs = {
  auditReminder90: boolean
  auditReminder60: boolean
  auditReminder30: boolean
  capaOverdue: boolean
  weeklySummary: boolean
  teamActivity: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  auditReminder90: false,
  auditReminder60: true,
  auditReminder30: true,
  capaOverdue: true,
  weeklySummary: false,
  teamActivity: false,
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('navly_notif_prefs') ?? '{}') } }
    catch { return DEFAULT_PREFS }
  })
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof NotifPrefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  function save() {
    localStorage.setItem('navly_notif_prefs', JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      <div className={cardCls}>
        <p className={sectionLabelCls}>Audit reminders</p>
        <div className="space-y-5">
          <Toggle
            label="90 days before audit"
            desc="Early heads-up to begin preparation and gap review"
            checked={prefs.auditReminder90}
            onToggle={() => toggle('auditReminder90')}
          />
          <Toggle
            label="60 days before audit"
            desc="Mid-range reminder to accelerate gap closure and CAPA work"
            checked={prefs.auditReminder60}
            onToggle={() => toggle('auditReminder60')}
          />
          <Toggle
            label="30 days before audit"
            desc="Final push — close open items, complete evidence uploads"
            checked={prefs.auditReminder30}
            onToggle={() => toggle('auditReminder30')}
          />
        </div>
      </div>

      <div className={cardCls}>
        <p className={sectionLabelCls}>Activity alerts</p>
        <div className="space-y-5">
          <Toggle
            label="Overdue CAPA alerts"
            desc="Email when a corrective action passes its due date without closure"
            checked={prefs.capaOverdue}
            onToggle={() => toggle('capaOverdue')}
          />
          <Toggle
            label="Weekly compliance summary"
            desc="Every Monday: compliance score, open CAPAs, clauses assessed this week"
            checked={prefs.weeklySummary}
            onToggle={() => toggle('weeklySummary')}
          />
          <Toggle
            label="Team activity"
            desc="Notify when a team member updates a clause or closes a CAPA"
            checked={prefs.teamActivity}
            onToggle={() => toggle('teamActivity')}
          />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
        <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-0.5">Email delivery coming soon</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">Your preferences are saved locally. Email delivery will be enabled once the notification service is live.</p>
        </div>
      </div>

      <button onClick={save}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
        {saved ? <><CheckSquare className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save preferences</>}
      </button>
    </div>
  )
}

// ── Account Tab ───────────────────────────────────────────────────────────────

function AccountTab({ facilityId }: { facilityId: string }) {
  const { user, signOut } = useAuth()
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handlePasswordChange() {
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    setPwSaving(true); setPwError('')
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setPwForm({ next: '', confirm: '' })
    setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
  }

  async function handleEmailChange() {
    if (!email.includes('@')) { setEmailError('Enter a valid email'); return }
    setEmailSaving(true); setEmailError(''); setEmailMsg('')
    const { error } = await supabase.auth.updateUser({ email })
    setEmailSaving(false)
    if (error) { setEmailError(error.message); return }
    setEmailMsg('Check your new email for a confirmation link.')
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('users').delete().eq('id', user!.id)
    await supabase.from('facilities').delete().eq('id', facilityId)
    await signOut()
  }

  return (
    <div className="space-y-5">
      {/* Account info */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Account</p>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md shadow-blue-600/20">
            {(user?.email ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Member since {new Date(user?.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Email address</label>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            <button onClick={handleEmailChange} disabled={emailSaving || email === user?.email}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shrink-0 cursor-pointer">
              {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update
            </button>
          </div>
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          {emailMsg && <p className="text-xs text-green-600">{emailMsg}</p>}
        </div>
      </div>

      {/* Change password */}
      <div className={cardCls}>
        <p className={sectionLabelCls}>Change password</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
              placeholder="Min. 8 characters" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password" className={inputCls} />
          </div>
          {pwError && <p className="text-xs text-red-600">{pwError}</p>}
          <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.next}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer">
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {pwSaved ? '✓ Password updated' : 'Update password'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-xl p-5">
        <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-4">Danger zone</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Delete account</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Permanently remove your account and all facility data. This cannot be undone.</p>
          </div>
          <button onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-1.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete account?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This permanently deletes your account, facility profile, all SOPs, corrective actions, and compliance data. Type{' '}
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">DELETE</span> to confirm.
            </p>
            <input value={deleteText} onChange={e => setDeleteText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={`${inputCls} mb-4`} />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteConfirm(false); setDeleteText('') }}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                Cancel
              </button>
              <button
                disabled={deleteText !== 'DELETE' || deleting}
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors cursor-pointer">
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'facility',      label: 'Facility',      icon: Building2,  desc: 'Profile, address & contact' },
  { id: 'team',          label: 'Team',          icon: Users,      desc: 'Members & permissions' },
  { id: 'notifications', label: 'Notifications', icon: Bell,       desc: 'Alerts & reminders' },
  { id: 'appearance',    label: 'Appearance',    icon: Sun,        desc: 'Theme & display' },
  { id: 'account',       label: 'Account',       icon: Key,        desc: 'Password & security' },
  { id: 'billing',       label: 'Billing',       icon: CreditCard, desc: 'Plan & features' },
]

export default function Settings() {
  const { facilityId, loading } = useFacility()
  const [tab, setTab] = useState<Tab>('facility')

  useEffect(() => { document.title = 'Settings — Navly FS' }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />Loading…
    </div>
  )

  if (!facilityId) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No facility found.</div>
  )

  const ActiveIcon = TABS.find(t => t.id === tab)?.icon ?? Building2

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
      {/* Mobile tab strip */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto shrink-0">
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 px-5 py-3 text-xs font-medium shrink-0 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Manage your workspace</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{t.desc}</div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 text-blue-400" />}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ActiveIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {TABS.find(t => t.id === tab)?.label}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {TABS.find(t => t.id === tab)?.desc}
              </p>
            </div>
          </div>

          {tab === 'facility'      && <FacilityTab facilityId={facilityId} />}
          {tab === 'team'           && <TeamTab facilityId={facilityId} />}
          {tab === 'notifications'  && <NotificationsTab />}
          {tab === 'appearance'     && <AppearanceTab />}
          {tab === 'account'        && <AccountTab facilityId={facilityId} />}
          {tab === 'billing'        && <BillingTab facilityId={facilityId} />}
        </div>
      </div>
    </div>
  )
}
