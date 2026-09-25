import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function AuthFallback({ label }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-[14px] font-light text-muted">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthFallback label="Restoring your workspace…" />
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <AuthFallback label="Restoring your workspace…" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
