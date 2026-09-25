import { useState } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { containerClass } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Analysis', href: '#analysis' },
  { label: 'Job matching', href: '#job-matching' },
]

/* top-nav — 64px, canvas, pinned, hairline underneath. */
export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const location = useLocation()
  const isAppRoute = ['/dashboard', '/upload', '/analysis', '/jobs', '/matches', '/history', '/settings'].some((path) => location.pathname.startsWith(path))

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
      <div className={cn(containerClass, 'flex h-16 items-center justify-between gap-6')}>
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="border-b-2 border-transparent py-1 text-[14px] font-normal tracking-[0.3px] text-ink transition-colors duration-150 hover:border-primary hover:text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button size="sm" asChild>
              <Link to="/dashboard">Open workspace</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className={cn('border-t border-hairline bg-canvas md:hidden', !open && 'hidden')}>
        <nav className={cn(containerClass, 'flex flex-col py-4')} aria-label="Mobile navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="label-uppercase border-b border-hairline py-4 text-muted">
              {link.label}
            </a>
          ))}
          {isAppRoute && <p className="py-4 text-[14px] leading-[1.55] font-light text-muted">Workspace tools live in the sidebar.</p>}
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={toggleTheme} className="w-full">
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
            {user ? (
              <Button size="sm" asChild className="w-full">
                <Link to="/dashboard">Workspace</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="w-full">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
