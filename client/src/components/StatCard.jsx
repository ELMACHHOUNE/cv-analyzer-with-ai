import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, detail, icon: Icon, tone = 'blue', trend }) {
  const tones = {
    blue: 'bg-primary/10 text-primary',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    green: 'bg-success/10 text-success',
  }
  return <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">{value}</p></div>{Icon && <span className={cn('grid h-10 w-10 place-items-center rounded-xl', tones[tone] || tones.blue)}><Icon className="h-5 w-5" /></span>}</div>{detail && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">{trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}{trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}{detail}{trend && <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-50" />}</div>}<span className="absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition group-hover:bg-primary/10" /></Card>
}
