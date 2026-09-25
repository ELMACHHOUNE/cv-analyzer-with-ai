import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Restoring your workspace…</div></div>
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas"><LoaderCircle className="h-5 w-5 animate-spin text-primary" /></div>
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
