import { useState } from 'react'
import { Menu, Moon, Sun } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
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
  return <div className="min-h-screen bg-canvas"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} /><div className={cn('min-h-screen transition-[padding] duration-300 lg:pl-[280px]', collapsed && 'lg:pl-[86px]')}><header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-border/70 bg-canvas/90 px-5 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">CVision workspace</p><h1 className="font-display text-lg font-semibold tracking-tight text-foreground">{pageName}</h1></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>{resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button><div className="hidden h-8 w-px bg-border sm:block" /><div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-xs font-bold text-primary">{pageName.slice(0, 2).toUpperCase()}</div></div></header><main className="mx-auto w-full max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><Outlet /></main></div></div>
}
