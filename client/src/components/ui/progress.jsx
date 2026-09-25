import * as ProgressPrimitive from '@radix-ui/react-progress'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/* Progress is a flat rectangular bar — 2px track, no radius. */
const Progress = forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} className={cn('relative h-1.5 w-full overflow-hidden rounded-none bg-surface-strong', className)} {...props}>
    <ProgressPrimitive.Indicator className={cn('h-full w-full flex-1 bg-primary transition-transform duration-500', indicatorClassName)} style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
