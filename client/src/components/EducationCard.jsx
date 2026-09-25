import { GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { safeArray } from '@/lib/utils'

export function EducationCard({ education = [] }) {
  const items = safeArray(education)
  if (!items.length) return <div className="border border-dashed border-hairline-strong p-8 text-center text-[14px] font-light text-muted">No structured education was returned for this CV.</div>

  return (
    <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2">
      {items.map((item, index) => (
        <Card key={`${item?.institution || 'education'}-${index}`} className="border-0 p-5">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-hairline bg-surface-card text-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-ink">{item?.degree || item?.qualification || 'Qualification'}</p>
              <p className="mt-2 text-[14px] font-light text-muted">{item?.institution || item?.school || item?.university || 'Institution not specified'}</p>
              <p className="mt-4 text-[12px] tracking-[0.5px] text-muted">
                {item?.startDate || item?.year || '—'}
                {item?.endDate ? ` — ${item?.endDate}` : ''}
              </p>
              {item?.field && <p className="mt-1 text-[12px] font-light text-muted">Field: {item.field}</p>}
              {item?.description && <p className="mt-4 text-[14px] leading-[1.55] font-light text-body">{item.description}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
