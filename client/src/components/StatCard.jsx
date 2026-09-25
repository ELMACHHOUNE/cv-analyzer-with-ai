import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/text-link'
import { cn } from '@/lib/utils'

/* spec-cell — the value carries the cell, the uppercase label describes it. */
export function StatCell({ label, value, detail, trend, className }) {
  return (
    <div className={cn('border border-hairline bg-canvas p-5', className)}>
      <Eyebrow tone="muted" as="p">{label}</Eyebrow>
      <p className="mt-4 text-[32px] leading-[1.1] font-bold tabular-nums text-ink">{value}</p>
      {detail && (
        <div className="mt-3 flex items-center gap-2 text-[13px] font-light text-muted">
          {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-success" aria-hidden="true" />}
          {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-error" aria-hidden="true" />}
          <span>{detail}</span>
        </div>
      )}
    </div>
  )
}

export function StatCard({ label, value, detail, trend, className }) {
  return <StatCell label={label} value={value} detail={detail} trend={trend} className={className} />
}
