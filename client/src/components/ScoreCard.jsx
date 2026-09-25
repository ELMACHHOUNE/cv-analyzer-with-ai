import { ArrowUpRight, Gauge, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NumberTicker } from '@/components/MagicEffects'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getScore, safeArray, scoreMeta } from '@/lib/utils'

const disclaimer = 'Scores are directional, not a hiring decision. Read them with the evidence behind them.'

export function ScoreCard({ score, title = 'CV score', description = 'A directional view of clarity, completeness, and evidence.', breakdown = [], action, compact = false }) {
  const resolved = getScore(score, null)
  const normalizedScore = resolved ?? 0
  const meta = scoreMeta(resolved)
  const items = safeArray(breakdown).map((item) => ({ label: item?.label || item?.key || 'Category', value: getScore(item?.value ?? item?.score, 0) }))
  return (
    <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 shadow-card sm:p-7">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title}</p>
          {description && <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Gauge className="h-5 w-5" /></span>
      </div>
      <div className="relative mt-7 flex items-end gap-3">
        <span className="font-display text-6xl font-semibold leading-none tracking-[-0.08em] text-foreground">
          {resolved === null ? <span className="text-muted-foreground">—</span> : <NumberTicker value={normalizedScore} />}
        </span>
        {resolved !== null && <span className="mb-1 text-lg text-muted-foreground">/ 100</span>}
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full transition-all" style={{ width: `${normalizedScore}%`, backgroundColor: meta.color }} />
        </span>
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
      </div>
      {items.length > 0 && (
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          {items.slice(0, compact ? 2 : 4).map((item) => (
            <div key={item.label} className="rounded-xl border border-border/70 bg-background/60 p-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}%</span>
              </div>
              <Progress value={item.value} className="mt-2 h-1.5" indicatorClassName="bg-cyan-500" />
            </div>
          ))}
        </div>
      )}
      {action && <div className="relative mt-6">{action}</div>}
      <p className="relative mt-5 text-[11px] leading-5 text-muted-foreground"><Target className="mr-1 inline h-3.5 w-3.5" />{disclaimer}</p>
    </Card>
  )
}

export function InlineScore({ score, to, label = 'View analysis' }) {
  const resolved = getScore(score, null)
  const meta = scoreMeta(resolved)
  return (
    <Link to={to} className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
      {label}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      <span className="sr-only">, score {resolved ?? 'not scored'} out of 100, {meta.label}</span>
    </Link>
  )
}
