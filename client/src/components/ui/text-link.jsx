import { ChevronRight } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/*
  button-text-link — inline UPPERCASE letter-spaced CTA terminated by a `›`
  chevron. Reads as "LEARN MORE". `onDark` inverts it for navy bands.
*/
export const ActionLink = forwardRef(({ className, children, onDark = false, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('group inline-flex min-h-11 items-center gap-1 text-[13px] font-bold tracking-[0.115em] uppercase', onDark ? 'text-on-dark' : 'text-primary', className)}
    {...props}
  >
    {children}
    <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
  </span>
))
ActionLink.displayName = 'ActionLink'

/* text-link — a link inside running copy. Undecorated until hovered. */
export const TextLink = forwardRef(({ className, ...props }, ref) => (
  <a ref={ref} className={cn('text-primary underline-offset-4 transition-colors hover:underline', className)} {...props} />
))
TextLink.displayName = 'TextLink'

/* Eyebrow — the label-uppercase line that opens a section or a card. */
export function Eyebrow({ className, tone = 'primary', as: Tag = 'p', ...props }) {
  return <Tag className={cn('label-uppercase', tone === 'primary' ? 'text-primary' : tone === 'muted' ? 'text-muted' : 'text-on-dark-soft', className)} {...props} />
}
