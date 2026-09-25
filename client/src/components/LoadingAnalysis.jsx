import { Check, CircleDashed, LoaderCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Eyebrow } from '@/components/ui/text-link'
import { cn } from '@/lib/utils'

const defaultStages = [
  { label: 'Uploading CV', detail: 'Sending your file securely' },
  { label: 'Server processing', detail: 'The backend is preparing the document' },
  { label: 'Analysis available', detail: 'Your structured review will appear when ready' },
]

/* A process list, not a spinner in a rounded box. */
export function LoadingAnalysis({ stages = defaultStages, progress = null, className }) {
  const clamped = progress === null ? null : Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('border border-hairline bg-canvas p-5 sm:p-7', className)} role="status" aria-live="polite">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        </span>
        <div>
          <Eyebrow as="p">In progress</Eyebrow>
          <h2 className="mt-3 text-[20px] leading-[1.3] font-bold">Preparing your CV intelligence</h2>
          <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">This can take a moment while the document is processed.</p>
        </div>
      </div>

      <ol className="mt-7 space-y-px bg-hairline">
        {stages.map((stage, index) => {
          const complete = clamped !== null && index === 0 && clamped >= 100
          const current = !complete && (clamped === null ? index === 0 : index === 1)
          return (
            <li key={stage.label} className="flex items-start gap-4 bg-canvas px-1 py-4">
              <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center', complete ? 'text-success' : current ? 'text-primary' : 'text-muted-soft')}>
                {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : current ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CircleDashed className="h-4 w-4" aria-hidden="true" />}
              </span>
              <div>
                <p className={cn('text-[15px] font-bold', complete || current ? 'text-ink' : 'text-muted')}>{stage.label}</p>
                <p className="mt-1 text-[13px] font-light text-muted">{stage.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {clamped !== null && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-[12px] tracking-[0.5px] text-muted">
            <span className="label-uppercase">Upload progress</span>
            <span className="tabular-nums">{Math.round(clamped)}%</span>
          </div>
          <Progress value={clamped} className="h-2" />
        </div>
      )}
    </div>
  )
}
