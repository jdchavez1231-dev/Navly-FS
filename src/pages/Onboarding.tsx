import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { CheckSquare, Square } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const FACILITY_TYPES = [
  { value: 'Bakery / Confectionery',         emoji: '🍞' },
  { value: 'Meat & Poultry Processing',       emoji: '🥩' },
  { value: 'Dairy Processing',                emoji: '🧀' },
  { value: 'Fresh Produce / Fruits & Veg',    emoji: '🥦' },
  { value: 'Seafood Processing',              emoji: '🐟' },
  { value: 'Beverage Manufacturing',          emoji: '🧃' },
  { value: 'Ready-to-Eat Foods',              emoji: '🥗' },
  { value: 'Dry Goods / Grains / Cereals',    emoji: '🌾' },
  { value: 'Frozen Foods / Cold Chain',       emoji: '❄️' },
  { value: 'Snack Foods',                     emoji: '🍿' },
  { value: 'Sauces, Condiments & Dressings',  emoji: '🫙' },
  { value: 'Other Food Manufacturing',        emoji: '🏭' },
]

const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '500+']

const ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Dairy / Milk', 'Eggs',
  'Wheat / Gluten', 'Soy', 'Fish', 'Shellfish',
  'Sesame', 'Mustard', 'Sulphites',
]

const STEPS = [
  'Facility type',
  'Allergens',
  'Regulatory body',
  'Food safety standard',
  'Audit date',
]

// ── Profile helpers ───────────────────────────────────────────────────────────

export type FacilityProfile = {
  facilityType: string
  employeeCount: string
  allergens: string[]
  products: string
}

export function loadFacilityProfile(): FacilityProfile | null {
  try {
    const raw = localStorage.getItem('navly_facility_profile')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveFacilityProfile(profile: FacilityProfile) {
  localStorage.setItem('navly_facility_profile', JSON.stringify(profile))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const facilityId = (location.state as { facilityId?: string })?.facilityId

  useEffect(() => { document.title = 'Setup — Navly FS' }, [])

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    // Step 0 — facility type
    facilityType: '',
    employeeCount: '',
    products: '',
    // Step 1 — allergens
    allergens: [] as string[],
    // Step 2 — regulatory
    regulatoryBody: '' as 'USDA' | 'FDA' | '',
    // Step 3 — standard
    activeStandard: '' as 'BRCGS' | 'SQF' | 'FSSC22000' | 'Custom' | '',
    // Step 4 — audit date
    auditDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleAllergen(a: string) {
    setForm(f => ({
      ...f,
      allergens: f.allergens.includes(a)
        ? f.allergens.filter(x => x !== a)
        : [...f.allergens, a],
    }))
  }

  const canAdvance = () => {
    if (step === 0) return form.facilityType !== ''
    if (step === 1) return true // allergens optional
    if (step === 2) return form.regulatoryBody !== ''
    if (step === 3) return form.activeStandard !== ''
    if (step === 4) return form.auditDate !== ''
    return false
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')

    // Save extra profile to localStorage for SOP builder context
    saveFacilityProfile({
      facilityType: form.facilityType,
      employeeCount: form.employeeCount,
      allergens: form.allergens,
      products: form.products,
    })

    const id = facilityId ?? (
      await supabase
        .from('users')
        .select('facility_id')
        .eq('id', user?.id)
        .single()
        .then(r => r.data?.facility_id)
    )

    const { error } = await supabase
      .from('facilities')
      .update({
        regulatory_body: form.regulatoryBody,
        active_standard: form.activeStandard,
        audit_date: form.auditDate,
      })
      .eq('id', id)

    if (error) {
      setError('Could not save your settings. Please try again.')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">Navly FS</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
              <span className={`text-xs hidden sm:block ${
                i === step ? 'text-blue-600 font-medium' : i < step ? 'text-emerald-600' : 'text-gray-400'
              }`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-5">
              {error}
            </div>
          )}

          {/* ── Step 0: Facility type ── */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What type of facility do you operate?</h2>
              <p className="text-sm text-gray-500 mb-5">This helps us generate documents and SOPs tailored to your operation.</p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {FACILITY_TYPES.map(({ value, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, facilityType: value }))}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                      form.facilityType === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base mr-2">{emoji}</span>
                    <span className={`text-sm font-medium ${form.facilityType === value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {value}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employees on site</label>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYEE_RANGES.map(r => (
                      <button key={r} onClick={() => setForm(f => ({ ...f, employeeCount: r }))}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          form.employeeCount === r
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Main products <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    value={form.products}
                    onChange={e => setForm(f => ({ ...f, products: e.target.value }))}
                    placeholder="e.g. bread, croissants, cakes"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Allergens ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which allergens are handled at your facility?</h2>
              <p className="text-sm text-gray-500 mb-5">Select all that apply. This will be used when building allergen management documents.</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {ALLERGENS.map(a => {
                  const checked = form.allergens.includes(a)
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAllergen(a)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        checked ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {checked
                        ? <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                        : <Square className="w-4 h-4 text-gray-300 shrink-0" />
                      }
                      <span className={`text-sm font-medium ${checked ? 'text-orange-700' : 'text-gray-700'}`}>{a}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">No allergens on site? Skip this step.</p>
            </div>
          )}

          {/* ── Step 2: Regulatory body ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which regulatory body oversees your facility?</h2>
              <p className="text-sm text-gray-500 mb-5">This determines which requirements apply to your operation.</p>
              <div className="space-y-3">
                {([
                  { value: 'FDA',  label: 'FDA',  desc: 'All food and beverage (non-meat/poultry)' },
                  { value: 'USDA', label: 'USDA', desc: 'Meat, poultry, and egg products' },
                ] as const).map(({ value, label, desc }) => (
                  <button key={value} onClick={() => setForm(f => ({ ...f, regulatoryBody: value }))}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-colors ${
                      form.regulatoryBody === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-semibold ${form.regulatoryBody === value ? 'text-blue-700' : 'text-gray-900'}`}>{label}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Food safety standard ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which food safety standard are you certified to?</h2>
              <p className="text-sm text-gray-500 mb-5">This seeds your compliance checklist and audit tracking.</p>
              <div className="space-y-3">
                {([
                  { value: 'BRCGS',     label: 'BRCGS',         desc: 'BRC Global Standard for Food Safety — Issue 9' },
                  { value: 'SQF',       label: 'SQF',           desc: 'Safe Quality Food — Edition 9' },
                  { value: 'FSSC22000', label: 'FSSC 22000',    desc: 'Food Safety System Certification' },
                  { value: 'Custom',    label: 'Custom / Other', desc: 'Build your own checklist' },
                ] as const).map(({ value, label, desc }) => (
                  <button key={value} onClick={() => setForm(f => ({ ...f, activeStandard: value }))}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-colors ${
                      form.activeStandard === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-semibold ${form.activeStandard === value ? 'text-blue-700' : 'text-gray-900'}`}>{label}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Audit date ── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">When is your next audit?</h2>
              <p className="text-sm text-gray-500 mb-5">We'll show a live countdown on your dashboard so you always know how much prep time you have.</p>
              <input
                type="date"
                value={form.auditDate}
                onChange={e => setForm(f => ({ ...f, auditDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-blue-800 mb-1">You're all set!</p>
                <p className="text-xs text-blue-600">
                  {form.facilityType && <span className="block">Facility: {form.facilityType}</span>}
                  {form.allergens.length > 0 && <span className="block">Allergens: {form.allergens.join(', ')}</span>}
                  {form.regulatoryBody && <span className="block">Regulatory: {form.regulatoryBody}</span>}
                  {form.activeStandard && <span className="block">Standard: {form.activeStandard}</span>}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-7">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                Continue
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!canAdvance() || loading}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                {loading ? 'Setting up your account…' : 'Go to dashboard →'}
              </button>
            )}
          </div>

          {/* Skip for allergens */}
          {step === 1 && (
            <button onClick={() => setStep(s => s + 1)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors">
              No allergens on site — skip this step
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Step {step + 1} of {STEPS.length} — you can change these later in Settings
        </p>
      </div>
    </div>
  )
}
