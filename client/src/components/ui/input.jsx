import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/* text-input — 48px tall, 14px/16px padding, hairline outline. On focus the
   outline thickens to ink, which replaces the usual glow ring. */
const Input = forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-12 w-full border border-hairline bg-canvas px-4 py-2 text-[16px] leading-[1.55] font-light text-ink outline-none transition-colors duration-150 placeholder:text-muted-soft',
      'hover:border-hairline-strong focus:border-ink disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted-soft',
      'aria-invalid:border-error aria-invalid:focus:border-error',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
