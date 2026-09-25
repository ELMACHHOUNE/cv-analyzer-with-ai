import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/text-link'
import { cn } from '@/lib/utils'

/* Page header — eyebrow, 32px display, light lead-in, action to the right. */
export function PageHeader({ eyebrow, title, description, action, backTo, className }) {
  return (
    <div className={cn('mb-10 flex flex-col gap-6 border-b border-hairline pb-8 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link to={backTo} className="label-uppercase mb-4 inline-flex items-center gap-1 text-muted transition-colors hover:text-primary">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" /> Back
          </Link>
        )}
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="text-[32px] leading-[1.15] font-bold text-balance lg:text-[40px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[16px] leading-[1.55] font-light text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  )
}
