import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, FolderOpen, Settings, LogOut, AlertTriangle, Sun, Moon, FileEdit, Menu, X, Shield } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useFacility } from '../hooks/useFacility'
import { useDarkMode } from '../hooks/useDarkMode'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tracker', icon: ClipboardCheck, label: 'BRCGS Tracker' },
  { to: '/sop-library', icon: FolderOpen, label: 'SOP Library' },
  { to: '/corrective-actions', icon: AlertTriangle, label: 'Corrective Actions' },
  { to: '/documents', icon: FileEdit, label: 'Documents' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { facility } = useFacility()
  const { dark, toggle } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-[100dvh] bg-[#F0F5FF] dark:bg-gray-950 overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded-xl focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      <aside
        data-open={String(sidebarOpen)}
        aria-label="Application sidebar"
        className="app-sidebar fixed inset-y-0 left-0 z-40 w-56 bg-white dark:bg-gray-900 flex flex-col shrink-0 border-r border-gray-100 dark:border-gray-800 shadow-xl shadow-blue-900/5"
      >
        <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Navly FS</div>
            <div className="text-xs text-gray-400">Food Safety</div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        <header className="h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {facility?.name ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {facility?.audit_date && <AuditCountdown date={facility.audit_date} />}
            <button
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm shadow-blue-600/25">
              {initials}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AuditCountdown({ date }: { date: string }) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return null

  const color = days <= 30
    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40'
    : days <= 90
    ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
    : 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40'

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${color}`}>
      {days}d to audit
    </span>
  )
}
