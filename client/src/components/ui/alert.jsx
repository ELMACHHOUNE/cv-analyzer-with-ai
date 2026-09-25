import { cva } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/* Callouts are hairline-outlined plates with a tinted fill — no glow. */
const alertVariants = cva('relative flex w-full gap-3 border p-4 text-[15px] leading-[1.55] font-light [&>svg]:mt-0.5 [&>svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border-hairline bg-surface-soft text-body',
      destructive: 'border-error/40 bg-error/[0.06] text-body',
      success: 'border-success/40 bg-success/[0.06] text-body',
      warning: 'border-warning/45 bg-warning/[0.08] text-body',
      dark: 'border-on-dark/20 bg-on-dark/[0.06] text-on-dark',
    },
  },
  defaultVariants: { variant: 'default' },
})

const Alert = forwardRef(({ className, variant, ...props }, ref) => <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />)
Alert.displayName = 'Alert'

const AlertTitle = forwardRef(({ className, ...props }, ref) => <h5 ref={ref} className={cn('text-[15px] leading-tight font-bold text-ink', className)} {...props} />)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('text-[14px] leading-[1.55] font-light text-muted', className)} {...props} />)
AlertDescription.displayName = 'AlertDescription'

function AlertIcon({ variant }) {
  if (variant === 'destructive') return <AlertCircle className="h-4 w-4 text-error" />
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4 text-success" />
  if (variant === 'warning') return <TriangleAlert className="h-4 w-4 text-warning" />
  if (variant === 'dark') return <Info className="h-4 w-4 text-on-dark-soft" />
  return <Info className="h-4 w-4 text-primary" />
}

export { Alert, AlertTitle, AlertDescription, AlertIcon }
