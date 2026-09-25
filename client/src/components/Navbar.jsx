import { useState } from 'react'
import { ArrowUpRight, Menu, Moon, Sparkles, Sun, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Analysis', href: '#analysis' },
  { label: 'Job matching', href: '#job-matching' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const location = useLocation()
  const isAppRoute = ['/dashboard', '/upload', '/analysis', '/jobs', '/matches', '/history', '/settings'].some((path) => location.pathname.startsWith(path))
  return <header className="relative z-40 border-b border-border/70 bg-canvas/90 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><Logo light={false} /><nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">{links.map((link) => <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">{link.label}</a>)}</nav><div className="hidden items-center gap-2 md:flex"><Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>{resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>{user ? <Button asChild size="sm"><Link to="/dashboard">Open workspace <ArrowUpRight className="h-3.5 w-3.5" /></Link></Button> : <><Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button><Button size="sm" asChild><Link to="/register">Get started <ArrowUpRight className="h-3.5 w-3.5" /></Link></Button></>}</div><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button></div><div className={cn('border-t border-border/70 bg-canvas px-5 py-4 md:hidden', !open && 'hidden')}><nav className="flex flex-col gap-1" aria-label="Mobile navigation">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{link.label}</a>)}{isAppRoute && <span className="px-3 py-2.5 text-xs text-muted-foreground">Workspace tools are available in the sidebar.</span>}<div className="mt-3 flex items-center gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" onClick={toggleTheme} className="flex-1"><span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>{resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>{user ? <Button size="sm" asChild className="flex-1"><Link to="/dashboard">Workspace</Link></Button> : <Button size="sm" asChild className="flex-1"><Link to="/register"><Sparkles className="h-3.5 w-3.5" /> Start</Link></Button>}</div></nav></div></header>
}
