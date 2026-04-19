import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    facilityName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  useEffect(() => { document.title = 'Create account — Navly FS' }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, facility_name: form.facilityName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Email confirmation is ON — Supabase returns no session until confirmed
    if (!data.session) {
      setConfirmSent(true)
      setLoading(false)
      return
    }

    // Email confirmation is OFF — session is live, create records now
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .insert({ name: form.facilityName })
      .select('id')
      .single()

    if (facilityError || !facility) {
      setError('Could not create facility. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('users').upsert({
      id: data.user.id,
      facility_id: facility.id,
      full_name: form.fullName,
      email: form.email,
      role: 'admin',
    }, { onConflict: 'id' })

    navigate('/onboarding', { state: { facilityId: facility.id } })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(145deg,#E8EFFF 0%,#F4F7FF 50%,#EBF2FF 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Navly FS</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        {confirmSent ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-1">We sent a confirmation link to</p>
            <p className="text-sm font-medium text-gray-800 mb-5">{form.email}</p>
            <p className="text-xs text-gray-400">Click the link in the email, then come back to sign in.</p>
            <Link to="/login" className="mt-5 inline-block text-sm font-medium text-blue-600 hover:underline">
              Go to sign in →
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              id="full-name"
              type="text"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={set('fullName')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="facility-name" className="block text-sm font-medium text-gray-700 mb-1">Facility name</label>
            <input
              id="facility-name"
              type="text"
              required
              autoComplete="organization"
              value={form.facilityName}
              onChange={set('facilityName')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Foods Inc."
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@facility.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
