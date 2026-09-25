import { GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { safeArray } from '@/lib/utils'

export function EducationCard({ education = [] }) {
  const items = safeArray(education)
  if (!items.length) return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No structured education was returned for this CV.</div>
  return <div className="grid gap-4 md:grid-cols-2">{items.map((item, index) => <Card key={`${item?.institution || 'education'}-${index}`} className="p-5"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><GraduationCap className="h-5 w-5" /></span><div><p className="font-semibold text-foreground">{item?.degree || item?.qualification || 'Qualification'}</p><p className="mt-1 text-sm text-muted-foreground">{item?.institution || item?.school || item?.university || 'Institution not specified'}</p><p className="mt-3 text-xs text-muted-foreground">{item?.startDate || item?.year || '—'}{item?.endDate ? ` — ${item?.endDate}` : ''}</p>{item?.field && <p className="mt-1 text-xs text-muted-foreground">Field: {item.field}</p>}{item?.description && <p className="mt-3 text-sm leading-6 text-foreground/75">{item.description}</p>}</div></div></Card>)}</div>
}
