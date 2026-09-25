import { BarChart3, BriefcaseBusiness, ChevronLeft, ChevronRight, FileText, History, LayoutDashboard, Settings, Upload, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { ActionLink } from '@/components/ui/text-link'
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

/* The workspace rail is a navy band — the dark counterweight to the canvas. */
export function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { user } = useAuth()

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-surface-dark/60 lg:hidden" />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-on-dark/10 bg-surface-dark text-on-dark transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-[88px]',
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-on-dark/10 px-5', collapsed && 'lg:justify-center lg:px-0')}>
          <Logo onDark compact={collapsed} />
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="ml-auto text-on-dark-soft hover:bg-on-dark/10 hover:text-on-dark lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className={cn('px-4 pt-8', collapsed && 'lg:px-3')}>
          <p className={cn('label-uppercase mb-3 px-3 text-on-dark-soft', collapsed && 'lg:text-center')}>{collapsed ? '•••' : 'Workspace'}</p>
          <nav className="space-y-1" aria-label="Workspace navigation">
            {navigation.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 text-[14px] font-normal tracking-[0.3px] transition-colors duration-150',
                    'text-on-dark-soft hover:bg-on-dark/10 hover:text-on-dark',
                    isActive && 'bg-on-dark font-bold text-surface-dark hover:bg-on-dark hover:text-surface-dark',
                    collapsed && 'lg:justify-center lg:px-0',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={cn('mt-auto p-4', collapsed && 'lg:p-3')}>
          <div className={cn('mb-4 border border-on-dark/15 p-4', collapsed && 'lg:hidden')}>
            <div className="flex items-center gap-2 text-on-dark">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="label-uppercase">New version</span>
            </div>
            <p className="mt-3 text-[14px] leading-[1.55] font-light text-on-dark-soft">Upload a refined CV and compare what changed.</p>
            <NavLink to="/upload" onClick={onClose} className="mt-3 inline-block">
              <ActionLink onDark>Upload CV</ActionLink>
            </NavLink>
          </div>

          <div className={cn('flex items-center gap-3 border-t border-on-dark/10 pt-4', collapsed && 'lg:justify-center lg:border-0 lg:pt-0')}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-on-dark/12 text-[12px] font-bold tracking-[0.5px] text-on-dark">
              {(user?.name || 'CV').slice(0, 2).toUpperCase()}
            </span>
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="truncate text-[14px] font-bold text-on-dark">{user?.name || 'Your workspace'}</p>
              <p className="truncate text-[12px] font-light text-on-dark-soft">{user?.email || 'Career intelligence'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn('mt-3 hidden w-full justify-start text-on-dark-soft hover:bg-on-dark/10 hover:text-on-dark lg:flex', collapsed && 'lg:justify-center')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <>
                <ChevronLeft className="h-4 w-4" /> Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
