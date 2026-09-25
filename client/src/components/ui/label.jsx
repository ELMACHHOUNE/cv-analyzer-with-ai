import * as LabelPrimitive from '@radix-ui/react-label'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn('text-[14px] leading-[1.4] font-bold text-ink peer-disabled:cursor-not-allowed peer-disabled:text-muted-soft', className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
