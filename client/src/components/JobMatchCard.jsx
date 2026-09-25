import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ActionLink } from '@/components/ui/text-link'
import { formatPercent, formatRelativeDate, getRecordId, scoreMeta } from '@/lib/utils'

const badgeVariant = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', muted: 'outline' }

/* inventory-card — the role, then the evidence, then LEARN MORE. */
export function JobMatchCard({ match, showJob = true }) {
  const job = match?.job || {}
  const meta = scoreMeta(match?.score)
  const id = getRecordId(match)
  const subtitle = showJob ? job.company || match?.company || 'Company not specified' : null

  return (
    <Card className="group flex h-full flex-col p-5 transition-colors duration-150 hover:border-hairline-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[18px] leading-[1.4] font-bold text-ink">{job.title || match?.jobTitle || 'Job match'}</h3>
          {subtitle && <p className="mt-1.5 truncate text-[14px] font-light text-muted">{subtitle}</p>}
          {job.location && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] font-light text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {job.location}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[28px] leading-[1.1] font-bold tabular-nums" style={{ color: meta.color }}>{formatPercent(match?.score)}</p>
          <Badge variant={badgeVariant[meta.tone] || 'outline'} className="mt-2">{meta.label}</Badge>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-hairline pt-4">
        <span className="text-[12px] tracking-[0.5px] text-muted">{formatRelativeDate(match?.createdAt)}</span>
        {id && (
          <Link to={`/matches/${encodeURIComponent(id)}`} className="inline-flex min-h-11 items-center">
            <ActionLink>View result</ActionLink>
          </Link>
        )}
      </div>
    </Card>
  )
}
