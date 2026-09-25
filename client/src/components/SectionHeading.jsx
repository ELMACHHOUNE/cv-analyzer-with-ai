import { Eyebrow } from '@/components/ui/text-link'
import { cn } from '@/lib/utils'

/* Section head — 48px display with a 16px light lead-in. */
export function SectionHeading({ eyebrow, title, description, align = 'left', onDark = false, className }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow tone={onDark ? 'soft' : 'primary'} className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className={cn('text-[32px] leading-[1.15] font-bold text-balance sm:text-[48px]', onDark && 'text-on-dark')}>{title}</h2>
      {description && <p className={cn('mt-5 text-[16px] leading-[1.55] font-light sm:text-[18px]', onDark ? 'text-on-dark-soft' : 'text-muted')}>{description}</p>}
    </div>
  )
}
