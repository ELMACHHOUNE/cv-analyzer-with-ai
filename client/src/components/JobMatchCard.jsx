import { ArrowUpRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatPercent, formatRelativeDate, getRecordId, scoreMeta } from '@/lib/utils'

export function JobMatchCard({ match, showJob = true }) {
  const job = match?.job || {}
  const meta = scoreMeta(match?.score)
  const id = getRecordId(match)
  return (
    <Card className="group p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BriefcaseBusiness className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{job.title || match?.jobTitle || 'Job match'}</h3>
            {showJob && <p className="mt-1 truncate text-sm text-muted-foreground">{job.company || match?.company || 'Company not specified'}</p>}
            {job.location && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{job.location}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: meta.color }}>{formatPercent(match?.score)}</p>
          <Badge variant={meta.tone === 'muted' ? 'outline' : meta.tone === 'success' ? 'success' : meta.tone === 'warning' ? 'warning' : 'default'}>{meta.label}</Badge>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
        <span className="text-xs text-muted-foreground">{formatRelativeDate(match?.createdAt)}</span>
        {id && <Link to={`/matches/${encodeURIComponent(id)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">View result <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
      </div>
    </Card>
  )
}
