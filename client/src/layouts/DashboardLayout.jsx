import { useState } from 'react'
import { Menu, Moon, Sun } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { containerClass } from '@/components/ui/section'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const pageNames = {
  '/dashboard': 'Overview',
  '/upload': 'My CVs',
  '/jobs': 'Job matcher',
  '/matches': 'Match results',
  '/history': 'History',
  '/settings': 'Settings',
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const location = useLocation()
  const rootPath = `/${location.pathname.split('/')[1] || 'dashboard'}`
  const pageName = pageNames[rootPath] || 'Workspace'

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />

      <div className={cn('min-h-screen transition-[padding] duration-300 lg:pl-[280px]', collapsed && 'lg:pl-[88px]')}>
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas">
          <div className={cn(containerClass, 'flex h-16 items-center justify-between gap-4')}>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="label-uppercase text-muted">CVision workspace</p>
                <h1 className="mt-1 text-[19px] leading-none font-bold">{pageName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <span className="hidden h-8 w-px bg-hairline sm:block" aria-hidden="true" />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-dark text-[12px] font-bold tracking-[0.5px] text-on-dark">{pageName.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <main className={cn(containerClass, 'py-10 lg:py-12')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
