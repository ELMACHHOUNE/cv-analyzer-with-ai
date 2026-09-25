import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, action, backTo, className }) {
  return <div className={cn('mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}><div className="min-w-0">{backTo && <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-primary"><ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back</Link>}{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}<h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>
}
