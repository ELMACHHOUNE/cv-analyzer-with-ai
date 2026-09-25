import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/*
  Cards are rectangular plates. Depth comes from the surface value, never a
  shadow. Pass tone="plate" for the soft-grey photo plate (surface-card),
  tone="soft" for a section divider, or tone="dark" for a navy band.
*/
const Card = forwardRef(({ className, tone = 'canvas', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-none text-ink',
      {
        canvas: 'border border-hairline bg-canvas',
        plate: 'border border-transparent bg-surface-card',
        soft: 'border border-transparent bg-surface-soft',
        strong: 'border border-transparent bg-surface-strong',
        dark: 'border border-transparent bg-surface-dark text-on-dark',
      }[tone],
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-2 p-6', className)} {...props} />)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ className, ...props }, ref) => <h3 ref={ref} className={cn('text-[18px] leading-[1.4] font-bold', className)} {...props} />)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ className, ...props }, ref) => <p ref={ref} className={cn('text-[14px] leading-[1.55] font-light text-muted', className)} {...props} />)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
