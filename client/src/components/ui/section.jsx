import { cn } from '@/lib/utils'

/*
  The editorial band. Every major section sits on 80px of vertical rhythm
  inside a 1440px container. Consecutive bands must not repeat the same
  surface value — that rotation is what carries the page.
*/
export const containerClass = ' mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10'

export function Section({ className, tone = 'canvas', size = 'section', id, ...props }) {
  return (
    <section
      id={id}
      className={cn(
        {
          canvas: 'bg-canvas text-ink',
          soft: 'bg-surface-soft text-ink',
          card: 'bg-surface-card text-ink',
          strong: 'bg-surface-strong text-ink',
          dark: 'bg-surface-dark text-on-dark',
        }[tone],
        /* Band rhythm is capped at {spacing.section} (80px) - 96px is BMW M's value. */
        size === 'lg' ? 'py-14 lg:py-16' : size === 'sm' ? 'py-12' : 'py-16 lg:py-section',
        className,
      )}
      {...props}
    />
  )
}

export function SectionInner({ className, ...props }) {
  return <div className={cn(containerClass, className)} {...props} />
}

/* Hairline rule — the only divider in the system. */
export function Rule({ className, tone = 'hairline', ...props }) {
  return <hr className={cn('h-px w-full border-0', tone === 'hairline' ? 'bg-hairline' : 'bg-hairline-strong', className)} {...props} />
}

/* Dark navy band with the faint technical column grid. */
export function DarkGrid({ className, ...props }) {
  return <div aria-hidden="true" className={cn('band-grid pointer-events-none absolute inset-0', className)} {...props} />
}
