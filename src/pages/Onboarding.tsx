import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STEPS = ['Regulatory body', 'Food safety standard', 'Next audit date']

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const facilityId = (location.state as { facilityId?: string })?.facilityId

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    regulatoryBody: '' as 'USDA' | 'FDA' | '',
    activeStandard: '' as 'BRCGS' | 'SQF' | 'FSSC22000' | 'Custom' | '',
    auditDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canAdvance = () => {
    if (step === 0) return form.regulatoryBody !== ''
    if (step === 1) return form.activeStandard !== ''
    if (step === 2) return form.auditDate !== ''
    return false
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              <span className={`text-xs ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Regulatory body */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Which regulatory body oversees your facility?</h2>
              <p className="text-sm text-gray-500 mb-5">This determines which requirements apply to your operation.</p>
              <div className="space-y-3">
                {(['USDA', 'FDA'] as const).map(body => (
                  <button
                    key={body}
                    onClick={() => setForm(f => ({ ...f, regulatoryBody: body }))}
                    className={`w-full text-left border rounded-xl p-4 transition-colors ${
                      form.regulatoryBody === body
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{body}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {body === 'USDA' ? 'Meat, poultry, and egg products' : 'All other food and beverage'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Standard */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Which food safety standard are you certified to?</h2>
              <p className="text-sm text-gray-500 mb-5">This seeds your compliance checklist.</p>
              <div className="space-y-3">
                {(
                  [
                    { value: 'BRCGS', label: 'BRCGS', desc: 'BRC Global Standard for Food Safety' },
                    { value: 'SQF', label: 'SQF', desc: 'Safe Quality Food — Edition 9' },
                    { value: 'FSSC22000', label: 'FSSC 22000', desc: 'Food Safety System Certification' },
                    { value: 'Custom', label: 'Custom / Other', desc: 'Build your own checklist' },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setForm(f => ({ ...f, activeStandard: value }))}
                    className={`w-full text-left border rounded-xl p-4 transition-colors ${
                      form.activeStandard === value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Audit date */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">When is your next audit?</h2>
              <p className="text-sm text-gray-500 mb-5">We'll show a countdown on your dashboard.</p>
              <input
                type="date"
                value={form.auditDate}
                onChange={e => setForm(f => ({ ...f, auditDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canAdvance() || loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Saving…' : 'Go to dashboard'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
