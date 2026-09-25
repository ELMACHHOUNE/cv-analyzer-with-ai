import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary/10 text-primary',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'border-border text-muted-foreground',
      success: 'border-transparent bg-success/10 text-success',
      warning: 'border-transparent bg-warning/10 text-warning-foreground',
      danger: 'border-transparent bg-destructive/10 text-destructive',
      dark: 'border-white/10 bg-white/10 text-cyan-100',
    },
  },
  defaultVariants: { variant: 'default' },
})

const Badge = forwardRef(({ className, variant, ...props }, ref) => <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
