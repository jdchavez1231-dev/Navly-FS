import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle, AlertTriangle, FileText, Sparkles, ArrowRight,
  ClipboardCheck, ShieldCheck, Zap, Bot, BarChart3, Users,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Landing() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Navly FS — BRCGS Audit Readiness, Powered by AI' }, [])

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true })
  }, [session, loading, navigate])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <AISection />
      <WorkflowSection />
      <Testimonials />
      <IntegrationsBanner />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Navly FS</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'How it works', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                {item}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link to="/signup"
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors">
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(37,99,235,0.08),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            BRCGS Issue 9 Ready
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Audit Readiness,<br />
            <span className="text-blue-600">Powered by AI.</span>
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
            Navly FS helps food manufacturers achieve BRCGS certification faster — with an AI-powered compliance tracker, auto-generated CAPAs, and an intelligent SOP builder built for your quality team.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/signup"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors shadow-lg shadow-blue-600/20">
              Request a demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium text-sm border border-gray-200 hover:border-gray-300 px-6 py-3 rounded-full transition-colors">
              Take a tour
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-4">Free to start · No credit card required</p>
        </div>

        {/* Right — dashboard mockup */}
        <div className="flex-1 w-full max-w-lg">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}

function DashboardMockup() {
  const sections = [
    { name: 'Senior Management', pct: 100, gaps: 0 },
    { name: 'Food Safety Plan', pct: 87, gaps: 2 },
    { name: 'Food Safety & Quality', pct: 72, gaps: 4 },
    { name: 'Site Standards', pct: 91, gaps: 1 },
    { name: 'Product Control', pct: 65, gaps: 3 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 overflow-hidden">
      {/* Top bar */}
      <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-blue-200 font-mono">Navly FS Dashboard</span>
        <div />
      </div>

      <div className="p-5">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Score', value: '82%', color: 'text-gray-900' },
            { label: 'Compliant', value: '41', color: 'text-emerald-600' },
            { label: 'Gaps', value: '10', color: 'text-red-500' },
            { label: 'Days left', value: '47', color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-medium">2 Fundamental clauses with gaps — requires immediate action</span>
        </div>

        {/* Section rows */}
        <div className="space-y-2">
          {sections.map(s => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{s.name}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.pct === 100 ? 'bg-emerald-500' : s.pct > 80 ? 'bg-blue-400' : 'bg-amber-400'}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 w-8 text-right">{s.pct}%</span>
              {s.gaps > 0 && <span className="text-xs text-red-500 w-12 text-right">{s.gaps} gap{s.gaps > 1 ? 's' : ''}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Trust bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  const certs = ['BRCGS Issue 9', 'SQF', 'FSSC 22000', 'ISO 22000', 'GFSI Recognized']
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-5">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-semibold mb-4">
          Built for facilities working toward
        </p>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {certs.map(c => (
            <span key={c} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">{c}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: <ClipboardCheck className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
      title: 'BRCGS Compliance Tracker',
      desc: 'Track all 50+ clauses across 9 sections in real time. Visual progress bars, clause-level evidence upload, and instant compliance scoring.',
      badge: 'Core',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      bg: 'bg-orange-50',
      title: 'Auto CAPA Creation',
      desc: 'Every gap automatically creates a Corrective Action. Full CAPA workflow with 5 Whys, fishbone analysis, and AI-generated action plans.',
      badge: 'Saves hours',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-violet-600" />,
      bg: 'bg-violet-50',
      title: 'AI SOP Builder',
      desc: 'Select a clause and facility type — Claude writes a complete, audit-ready SOP in 30 seconds. Download as a Word doc or copy to your system.',
      badge: 'New',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
      title: 'SOP Gap Analysis',
      desc: 'Upload your existing SOPs. AI cross-references them against BRCGS requirements and flags exactly what\'s missing — clause by clause.',
      badge: 'AI-powered',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: <Bot className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50',
      title: 'Clause-level AI Assistant',
      desc: 'Ask anything about a specific requirement. Get auditor-grade answers on what evidence is needed, what inspectors look for, and how to demonstrate compliance.',
      badge: 'Always on',
      badgeColor: 'bg-sky-100 text-sky-700',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-pink-600" />,
      bg: 'bg-pink-50',
      title: 'Audit Readiness Report',
      desc: 'One-click PDF export of your full readiness status — compliance scores, open CAPAs, fundamental gaps, and days to audit. Share with your team or auditor.',
      badge: 'Export ready',
      badgeColor: 'bg-pink-100 text-pink-700',
    },
  ]

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
            Platform overview
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            High-performing QA teams<br />are built here
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Everything you need to pass your BRCGS audit — from clause tracking to corrective actions to AI-generated SOPs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className={`${f.bg} rounded-2xl p-6 border border-white hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/80">
                  {f.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.badgeColor}`}>{f.badge}</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── AI Section ────────────────────────────────────────────────────────────────

function AISection() {
  const messages = [
    { role: 'user', text: 'What evidence do I need for clause 4.2.1?' },
    { role: 'ai', text: 'For clause 4.2.1 (Food Safety Manual), you\'ll need: a documented food safety policy signed by senior management, an organizational chart showing food safety responsibilities, and records of the last management review meeting. Auditors will typically ask to see the policy displayed in common areas as well.' },
    { role: 'user', text: 'We had a pest sighting last week. How do we handle this as a CAPA?' },
    { role: 'ai', text: 'Document it immediately as a Major non-conformance under clause 4.14. Your CAPA should include: (1) immediate containment — close the affected area, (2) root cause using the fishbone method across Man/Machine/Method dimensions, (3) corrective action with your pest control contractor within 24 hours, and (4) a verification inspection within 14 days. I\'ve drafted the CAPA framework for you.' },
  ]

  return (
    <section className="py-24 bg-[#0B1628] overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,rgba(37,99,235,0.2),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        {/* Left text */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI Agent
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Unblock work and unlock<br />potential with your<br />
            <span className="text-blue-400">personal AI Auditor</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
            Ask anything about BRCGS requirements. Get instant, auditor-grade answers that help you prepare evidence, write non-conformances, and generate CAPAs — all in context of your specific clause.
          </p>
          <Link to="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">
            Try the AI assistant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Chat mockup */}
        <div className="flex-1 w-full max-w-lg">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white">BRCGS AI Assistant</span>
              <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online
              </span>
            </div>
            <div className="space-y-4 max-h-64 overflow-hidden">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-xs rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Workflow section ──────────────────────────────────────────────────────────

function WorkflowSection() {
  const steps = [
    {
      icon: <ClipboardCheck className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      title: 'Track every clause',
      desc: 'Work through all 50+ BRCGS clauses, mark status, attach evidence, and leave notes — all in one place.',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-50',
      title: 'Auto-generate CAPAs',
      desc: 'Mark a gap — a CAPA is created instantly. Use AI to fill in root cause, corrective and preventive actions in seconds.',
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50',
      title: 'Close gaps, pass audits',
      desc: 'Track CAPAs to verified closure. Generate your readiness report and walk into your audit with full confidence.',
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-[#F0F5FF]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          <div className="lg:w-80 shrink-0">
            <div className="inline-block bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              How it works
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Build audit readiness through everyday habits
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Turn daily compliance work into a continuous process. No more scrambling weeks before an audit.
            </p>
            <Link to="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 mt-6">
              Learn more <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                    {s.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      title: 'Quality Manager, Pacific Foods Co.',
      avatar: 'SC',
      quote: 'We cut our pre-audit prep time from three weeks to four days. The AI-generated CAPAs alone saved our team over 20 hours. Walking into our BRCGS audit with a 94% compliance score was a completely new experience.',
    },
    {
      name: 'Marcus Thompson',
      title: 'Food Safety Director, Midwest Bakery Group',
      avatar: 'MT',
      quote: 'The SOP builder is incredible. I described our allergen handling process and had a fully structured, audit-ready SOP in under a minute. It would have taken me half a day to write that from scratch.',
    },
    {
      name: 'Priya Nair',
      title: 'QA Coordinator, Green Valley Produce',
      avatar: 'PN',
      quote: 'Finally a tool that speaks BRCGS fluently. The clause-level AI assistant answered questions I\'d normally have to call my consultant for. It paid for itself on the first question.',
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-4">
          <div className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
            Customer stories
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-8 mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight lg:w-72 shrink-0">
            Trusted by top-performing QA teams
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-lg pt-1">
            Food manufacturers across the industry use Navly FS to stay audit-ready year-round — not just the week before an inspection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.title}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">"{t.quote}"</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '50+', label: 'BRCGS clauses covered' },
            { value: '10×', label: 'faster CAPA creation' },
            { value: '30s', label: 'to generate a full SOP' },
            { value: '100%', label: 'BRCGS Issue 9 aligned' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Integrations banner ───────────────────────────────────────────────────────

function IntegrationsBanner() {
  const integrations = ['BRCGS', 'SQF', 'FSSC 22000', 'ISO 22000', 'PDF Export', 'DOCX Import', 'Supabase', 'Claude AI']
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          Integrations
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          Integrate everything.<br />Align everything.
        </h2>
        <p className="text-white/70 text-base mb-10 max-w-lg mx-auto">
          Connect Navly FS with your existing quality documents and tools to keep data flowing and compliance moving.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {integrations.map(i => (
            <div key={i} className="bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur hover:bg-white/20 transition-colors">
              {i}
            </div>
          ))}
        </div>
        <Link to="/signup"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-full text-sm hover:bg-blue-50 transition-colors shadow-xl">
          Get started free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 bg-[#F0F5FF]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Your people are<br />your business
        </h2>
        <p className="text-gray-500 text-lg mb-8">
          Ensure both are successful with Navly FS. Start tracking your BRCGS compliance today — free.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full text-sm transition-colors shadow-lg shadow-blue-600/25">
            Request a demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/signup"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3.5 rounded-full text-sm transition-colors">
            Take a free tour
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    {
      heading: 'Platform',
      links: ['BRCGS Tracker', 'Corrective Actions', 'SOP Library', 'AI SOP Builder', 'Audit Report'],
    },
    {
      heading: 'Standards',
      links: ['BRCGS Issue 9', 'SQF Edition 9', 'FSSC 22000', 'ISO 22000', 'GFSI'],
    },
    {
      heading: 'Resources',
      links: ['Documentation', 'BRCGS Guide', 'Blog', 'Changelog', 'Support'],
    },
    {
      heading: 'Company',
      links: ['About', 'Pricing', 'Privacy Policy', 'Terms of Service', 'Contact'],
    },
  ]

  return (
    <footer className="border-t border-gray-100 bg-gray-50 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Navly FS</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">
              AI-powered BRCGS audit readiness for food manufacturers.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Users className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-xs text-gray-400">Join 5,000+ QA professionals</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{col.heading}</div>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">© 2025 Navly FS. All rights reserved.</span>
          <span className="text-xs text-gray-400">Built for BRCGS Issue 9 compliance</span>
        </div>
      </div>
    </footer>
  )
}
