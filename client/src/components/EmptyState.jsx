import { Inbox } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact = false }) {
  return <Card className={cn('flex flex-col items-center justify-center border-dashed bg-card/60 text-center', compact ? 'min-h-48 p-6' : 'min-h-72 p-8', className)}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>{description && <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}{action && <div className="mt-5">{action}</div>}</Card>
}
