import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-32 w-full resize-y border border-hairline bg-canvas px-4 py-3 text-[16px] leading-[1.55] font-light text-ink outline-none transition-colors duration-150 placeholder:text-muted-soft',
      'hover:border-hairline-strong focus:border-ink disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted-soft',
      'aria-invalid:border-error aria-invalid:focus:border-error',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
