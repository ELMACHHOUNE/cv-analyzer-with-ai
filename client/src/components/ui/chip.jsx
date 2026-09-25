import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/*
  filter-chip         : canvas plate, 1px hairline-strong outline, caption type
  filter-chip-active  : ink plate, on-dark type
  Rectangular, 8px vertical / 14px horizontal, 44px effective tap target.
*/
const chipVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 border px-3.5 py-2 text-[12px] leading-[1.4] tracking-[0.5px] whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      active: {
        true: 'border-ink bg-ink/50 text-on-dark',
        false: 'border-hairline-strong bg-canvas text-ink active:border-ink',
      },
    },
    defaultVariants: { active: false },
  },
)

const Chip = forwardRef(({ className, active, ...props }, ref) => <button ref={ref} type="button" aria-pressed={active || undefined} className={cn(chipVariants({ active, className }))} {...props} />)
Chip.displayName = 'Chip'

function ChipRow({ className, children, ...props }) {
  return <div className={cn('no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0', className)} {...props}>{children}</div>
}

export { Chip, ChipRow, chipVariants }
