import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ className, to = '/', light = false, compact = false }) {
  return <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="CVision AI home"><span className={cn('relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border transition-transform duration-300 group-hover:-rotate-3', light ? 'border-white/20 bg-white/10' : 'border-primary/20 bg-primary/10')}><span className="absolute -right-2 -top-3 h-7 w-7 rounded-full bg-cyan-300/30 blur-md transition group-hover:bg-cyan-200/50" /><span className={cn('relative font-display text-sm font-bold tracking-tight', light ? 'text-white' : 'text-primary')}>CV</span></span>{!compact && <span className={cn('font-display text-lg font-semibold tracking-[-0.04em]', light ? 'text-white' : 'text-foreground')}>CVision<span className={cn(light ? 'text-cyan-300' : 'text-primary')}>.</span></span>}</Link>
}
