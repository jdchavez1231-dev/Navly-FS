import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import SOPLibrary from './pages/SOPLibrary'
import GapReport from './pages/GapReport'
import Settings from './pages/Settings'
import CorrectiveActions from './pages/CorrectiveActions'
import DocumentCreator from './pages/DocumentCreator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* Protected app — pathless layout wrapper keeps URLs at /dashboard, /tracker, etc. */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="tracker/:sectionId" element={<Tracker />} />
          <Route path="sop-library" element={<SOPLibrary />} />
          <Route path="gap-report/:reportId" element={<GapReport />} />
          <Route path="corrective-actions" element={<CorrectiveActions />} />
          <Route path="documents" element={<DocumentCreator />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
