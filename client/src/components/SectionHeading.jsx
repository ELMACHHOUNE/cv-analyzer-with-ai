import { cn } from '@/lib/utils'

export function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>{eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}<h2 className="font-display text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">{title}</h2>{description && <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>}</div>
}
