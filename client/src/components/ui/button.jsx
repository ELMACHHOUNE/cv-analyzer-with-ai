import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/*
  button-primary  : BMW Blue, white type, 14px/700/0.5px, 48px tall, 0px radius
  button-secondary: canvas plate, 1px hairline-strong outline, ink type
  on-dark         : transparent, 1px on-dark outline
  text-link       : UPPERCASE 13px/700/1.5px inline CTA ("LEARN MORE ›")
*/
const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap text-[14px] font-bold tracking-[0.5px] uppercase transition-colors duration-150 outline-none disabled:pointer-events-none disabled:opacity-45', {
  variants: {
    variant: {
      default: 'bg-primary text-on-primary active:bg-primary-active',
      secondary: 'bg-surface-strong text-ink active:bg-hairline-strong',
      outline: 'border border-hairline-strong bg-canvas text-ink active:bg-surface-strong',
      onDark: 'border border-on-dark bg-transparent text-on-dark active:bg-on-dark/12',
      'onDarkSolid': 'bg-on-dark text-surface-dark active:bg-on-dark-soft',
      dark: 'bg-surface-dark text-on-dark active:bg-surface-dark-elevated',
      ghost: 'bg-transparent text-ink active:bg-surface-strong',
      destructive: 'bg-error text-on-error active:opacity-90',
      link: 'h-auto px-0 text-primary normal-case tracking-normal hover:underline',
    },
    size: {
      default: 'h-12 px-8',
      sm: 'h-10 px-5 text-[13px]',
      lg: 'h-14 px-9 text-[15px]',
      icon: 'h-12 w-12 rounded-full',
      'icon-sm': 'h-10 w-10 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const Button = forwardRef(({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size, className }))} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
