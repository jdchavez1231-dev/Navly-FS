import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, FolderOpen, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useFacility } from '../hooks/useFacility'

export default function Layout() {
  const { user, signOut } = useAuth()
  const { facility } = useFacility()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#0F6E56]/10 text-[#0F6E56]'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-[#0A2340] flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-base font-bold text-white tracking-tight">Navly</div>
          <div className="text-xs text-white/40 mt-0.5">Food Safety Platform</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink to="/tracker" className={linkClass}>
            <ClipboardCheck className="w-4 h-4" />
            BRCGS Tracker
          </NavLink>
          <NavLink to="/sop-library" className={linkClass}>
            <FolderOpen className="w-4 h-4" />
            SOP Library
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm font-medium text-gray-700 truncate">
            {facility?.name ?? ''}
          </span>
          <div className="flex items-center gap-3">
            {facility?.audit_date && <AuditCountdown date={facility.audit_date} />}
            <div className="w-8 h-8 rounded-full bg-[#0A2340] flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AuditCountdown({ date }: { date: string }) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return null

  const color = days <= 30 ? 'text-red-600 bg-red-50 border-red-200'
    : days <= 90 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      {days}d to audit
    </span>
  )
}
