import { cva } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative flex w-full gap-3 rounded-xl border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border-primary/20 bg-primary/5 text-foreground',
      destructive: 'border-destructive/20 bg-destructive/5 text-foreground',
      success: 'border-success/20 bg-success/5 text-foreground',
      warning: 'border-warning/25 bg-warning/5 text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

const Alert = forwardRef(({ className, variant, ...props }, ref) => <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />)
Alert.displayName = 'Alert'

const AlertTitle = forwardRef(({ className, ...props }, ref) => <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm leading-relaxed text-muted-foreground [&_p]:leading-relaxed', className)} {...props} />)
AlertDescription.displayName = 'AlertDescription'

function AlertIcon({ variant }) {
  if (variant === 'destructive') return <AlertCircle className="h-4 w-4 text-destructive" />
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4 text-success" />
  if (variant === 'warning') return <TriangleAlert className="h-4 w-4 text-warning" />
  return <Info className="h-4 w-4 text-primary" />
}

export { Alert, AlertTitle, AlertDescription, AlertIcon }
