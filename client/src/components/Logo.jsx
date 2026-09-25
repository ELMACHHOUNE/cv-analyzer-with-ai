import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* A square mark and a wordmark. No roundel, no gradient, no glow. */
export function Logo({ className, to = '/', onDark = false, compact = false }) {
  return (
    <Link to={to} aria-label="CVision AI home" className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center text-[13px] font-bold tracking-[0.5px]',
          onDark ? 'bg-on-dark text-surface-dark' : 'bg-surface-dark text-on-dark',
        )}
        aria-hidden="true"
      >
        CV
      </span>
      {!compact && (
        <span className={cn('inline-flex items-baseline gap-1.5 text-[19px] leading-none font-bold', onDark ? 'text-on-dark' : 'text-ink')}>
          CVision
          <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
        </span>
      )}
    </Link>
  )
}
