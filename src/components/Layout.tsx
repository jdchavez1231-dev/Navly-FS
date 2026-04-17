import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, FolderOpen } from 'lucide-react'

export default function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <div className="text-base font-semibold text-gray-900">SafeStandard</div>
          <div className="text-xs text-gray-400 mt-0.5">BRCGS Food Safety</div>
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
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">Issue 9</div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
