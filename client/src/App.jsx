import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DashboardLayout } from '@/layouts/DashboardLayout'

const Landing = lazy(() => import('@/pages/Landing').then(({ Landing: page }) => ({ default: page })))
const Login = lazy(() => import('@/pages/Login').then(({ Login: page }) => ({ default: page })))
const Register = lazy(() => import('@/pages/Register').then(({ Register: page }) => ({ default: page })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then(({ Dashboard: page }) => ({ default: page })))
const UploadResume = lazy(() => import('@/pages/UploadResume').then(({ UploadResume: page }) => ({ default: page })))
const ResumeAnalysis = lazy(() => import('@/pages/ResumeAnalysis').then(({ ResumeAnalysis: page }) => ({ default: page })))
const JobMatcher = lazy(() => import('@/pages/JobMatcher').then(({ JobMatcher: page }) => ({ default: page })))
const MatchResult = lazy(() => import('@/pages/MatchResult').then(({ MatchResult: page }) => ({ default: page })))
const History = lazy(() => import('@/pages/History').then(({ History: page }) => ({ default: page })))
const Settings = lazy(() => import('@/pages/Settings').then(({ Settings: page }) => ({ default: page })))

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-10 w-10 animate-spin border-2 border-primary border-t-transparent" aria-label="Loading page" />
    </div>
  )
}

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadResume />} />
              <Route path="/analysis" element={<ResumeAnalysis />} />
              <Route path="/analysis/:analysisId" element={<ResumeAnalysis />} />
              <Route path="/jobs" element={<JobMatcher />} />
              <Route path="/matches" element={<MatchResult />} />
              <Route path="/matches/:matchId" element={<MatchResult />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  )
}
