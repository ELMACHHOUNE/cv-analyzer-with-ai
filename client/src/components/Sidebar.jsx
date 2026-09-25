import { BarChart3, BriefcaseBusiness, ChevronLeft, ChevronRight, FileText, History, LayoutDashboard, Settings, Upload, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My CVs', to: '/upload', icon: FileText },
  { label: 'Job matcher', to: '/jobs', icon: BriefcaseBusiness },
  { label: 'Match results', to: '/matches', icon: BarChart3 },
  { label: 'History', to: '/history', icon: History },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { user } = useAuth()
  return <>
    {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" />}
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full', collapsed && 'lg:w-[86px]')}>
      <div className={cn('flex h-20 items-center border-b border-white/10 px-5', collapsed && 'lg:justify-center lg:px-0')}><Logo light compact={collapsed} /><Button variant="ghost" size="icon-sm" onClick={onClose} className="ml-auto text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></Button></div>
      <div className={cn('px-4 pt-7', collapsed && 'lg:px-3')}><p className={cn('mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500', collapsed && 'lg:text-center lg:text-[0px]')}>{collapsed ? '•' : 'Workspace'}</p><nav className="space-y-1" aria-label="Workspace navigation">{navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60', isActive && 'bg-white/10 text-white shadow-inner shadow-white/5', collapsed && 'lg:justify-center lg:px-0')} title={collapsed ? label : undefined}><Icon className="h-[18px] w-[18px] shrink-0" /><span className={cn(collapsed && 'lg:hidden')}>{label}</span></NavLink>)}</nav></div>
      <div className={cn('mt-auto p-4', collapsed && 'lg:p-3')}><div className={cn('mb-3 rounded-2xl border border-white/10 bg-white/5 p-4', collapsed && 'lg:hidden')}><div className="flex items-center gap-2 text-cyan-200"><Upload className="h-4 w-4" /><span className="text-xs font-semibold">New version ready?</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Upload a refined CV and compare what changed.</p><NavLink to="/upload" onClick={onClose} className="mt-3 inline-flex text-xs font-semibold text-cyan-200 hover:text-white">Upload CV <ChevronRight className="ml-1 h-3 w-3" /></NavLink></div><div className={cn('flex items-center gap-3 border-t border-white/10 pt-4', collapsed && 'lg:justify-center lg:border-0 lg:pt-0')}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-200">{user?.name?.slice(0, 2).toUpperCase() || 'CV'}</div><div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}><p className="truncate text-sm font-semibold text-white">{user?.name || 'Your workspace'}</p><p className="truncate text-xs text-slate-500">{user?.email || 'Career intelligence'}</p></div></div><Button variant="ghost" size="sm" onClick={onToggleCollapse} className={cn('mt-3 hidden w-full justify-start text-slate-500 hover:bg-white/8 hover:text-white lg:flex', collapsed && 'lg:justify-center')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}</Button></div>
    </aside>
  </>
}
