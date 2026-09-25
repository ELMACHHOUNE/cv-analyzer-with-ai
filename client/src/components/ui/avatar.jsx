import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Avatar = forwardRef(({ className, ...props }, ref) => <AvatarPrimitive.Root ref={ref} className={cn('relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full', className)} {...props} />)
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = forwardRef(({ className, ...props }, ref) => <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />)
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback ref={ref} className={cn('flex h-full w-full items-center justify-center rounded-full bg-surface-dark text-[12px] font-bold tracking-[0.5px] text-on-dark', className)} {...props} />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
