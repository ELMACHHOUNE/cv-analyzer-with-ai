import { Check, CircleDashed, LoaderCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const defaultStages = [
  { label: 'Uploading CV', detail: 'Sending your file securely' },
  { label: 'Server processing', detail: 'The backend is preparing the document' },
  { label: 'Analysis available', detail: 'Your structured review will appear when ready' },
]

export function LoadingAnalysis({ stages = defaultStages, progress = null, className }) {
  return <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6', className)} role="status" aria-live="polite"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><LoaderCircle className="h-5 w-5 animate-spin" /></div><div><p className="font-display font-semibold text-foreground">Preparing your CV intelligence</p><p className="mt-1 text-sm text-muted-foreground">This can take a moment while the document is processed.</p></div></div><div className="mt-6 space-y-4">{stages.map((stage, index) => { const complete = index === 0 && progress !== null && progress >= 100; const current = !complete && (index === 0 || (progress === null && index === 0)); return <div key={stage.label} className="flex gap-3"><span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border', complete ? 'border-success/30 bg-success/10 text-success' : current ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{complete ? <Check className="h-3 w-3" /> : current ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <CircleDashed className="h-3 w-3" />}</span><div><p className={cn('text-sm font-medium', complete || current ? 'text-foreground' : 'text-muted-foreground')}>{stage.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{stage.detail}</p></div></div> })}</div>{progress !== null && <div className="mt-6"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Upload progress</span><span>{Math.min(100, Math.max(0, progress))}%</span></div><Progress value={Math.min(100, Math.max(0, progress))} /></div>}</div>
}
