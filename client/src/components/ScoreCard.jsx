import { ArrowUpRight, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NumberTicker } from '@/components/MagicEffects'
import { Eyebrow } from '@/components/ui/text-link'
import { Progress } from '@/components/ui/progress'
import { getScore, safeArray, scoreMeta } from '@/lib/utils'

const disclaimer = 'Scores are directional, not a hiring decision. Read them with the evidence behind them.'

/* The score reads as a headline: one number, one verdict, one bar. */
export function ScoreCard({ score, title = 'CV score', description = 'A directional view of clarity, completeness, and evidence.', breakdown = [], action, className }) {
  const resolved = getScore(score, null)
  const normalizedScore = resolved ?? 0
  const meta = scoreMeta(resolved)
  const items = safeArray(breakdown).map((item) => ({ label: item?.label || item?.key || 'Category', value: getScore(item?.value ?? item?.score, 0) }))

  return (
    <div className={`flex h-full flex-col border border-hairline bg-canvas p-6 sm:p-7 ${className || ''}`}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow as="p">{title}</Eyebrow>
          {description && <p className="mt-3 max-w-sm text-[15px] leading-[1.55] font-light text-muted">{description}</p>}
        </div>
        <span className="label-uppercase shrink-0" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <div className="mt-8 flex items-end gap-2">
        <span className="text-[64px] leading-[1.05] font-bold tabular-nums text-ink">
          {resolved === null ? '—' : <NumberTicker value={normalizedScore} />}
        </span>
        <span className="mb-2 text-[16px] font-light text-muted">/ 100</span>
      </div>

      <Progress value={normalizedScore} className="mt-5 h-2" indicatorClassName={meta.barClass} />

      {items.length > 0 && (
        <dl className="mt-8 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
          {items.slice(0, 4).map((item) => (
            <div key={item.label} className="bg-canvas p-4">
              <dt className="label-uppercase truncate text-muted">{item.label}</dt>
              <dd className="mt-2 text-[20px] leading-[1.3] font-bold tabular-nums text-ink">{item.value}%</dd>
              <Progress value={item.value} className="mt-3" />
            </div>
          ))}
        </dl>
      )}

      {action && <div className="mt-8">{action}</div>}

      <p className="mt-auto pt-8 text-[12px] leading-[1.4] font-light text-muted">
        <Target className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" />
        {disclaimer}
      </p>
    </div>
  )
}

export function InlineScore({ score, to, label = 'View analysis' }) {
  const resolved = getScore(score, null)
  const meta = scoreMeta(resolved)
  return (
    <Link to={to} className="group inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold tracking-[0.115em] text-primary uppercase">
      {label}
      <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      <span className="sr-only">, score {resolved ?? 'not scored'} out of 100, {meta.label}</span>
    </Link>
  )
}
