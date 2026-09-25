import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/* Badges are rectangular plates — 2px radius at most. */
const badgeVariants = cva('inline-flex items-center gap-1.5 border px-2.5 py-1 text-[12px] leading-[1.4] tracking-[0.5px] whitespace-nowrap', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-on-primary',
      secondary: 'border-transparent bg-surface-strong text-ink',
      outline: 'border-hairline-strong bg-canvas text-ink',
      success: 'border-transparent bg-success/12 text-success-foreground',
      warning: 'border-transparent bg-warning/15 text-warning-foreground',
      danger: 'border-transparent bg-error/12 text-error',
      info: 'border-transparent bg-primary/10 text-primary',
      dark: 'border-on-dark/25 bg-on-dark/10 text-on-dark',
    },
  },
  defaultVariants: { variant: 'default' },
})

const Badge = forwardRef(({ className, variant, ...props }, ref) => <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
