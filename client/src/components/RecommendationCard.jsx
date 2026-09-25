import { ArrowUpRight, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { safeArray } from '@/lib/utils'

export function RecommendationCard({ recommendations = [], title = 'Recommendations', limit }) {
  const items = safeArray(recommendations)
  const visibleItems = limit ? items.slice(0, limit) : items
  return <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Lightbulb className="h-4 w-4" /></span><div><h2 className="font-display text-lg font-semibold">{title}</h2><p className="text-xs text-muted-foreground">Suggestions to review, never automatic changes.</p></div></div>{visibleItems.length ? <div className="mt-5 space-y-3">{visibleItems.map((recommendation, index) => { const text = typeof recommendation === 'string' ? recommendation : recommendation?.text || recommendation?.title || recommendation?.recommendation; if (!text) return null; return <div key={`${text}-${index}`} className="flex gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5"><ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-sm leading-6 text-foreground/80">{text}</p></div> })}</div> : <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No recommendations were returned for this analysis.</p>}</Card>
}
