import { BriefcaseBusiness, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { safeArray } from '@/lib/utils'

export function ExperienceTimeline({ experience = [] }) {
  const items = safeArray(experience)
  if (!items.length) return <div className="border border-dashed border-hairline-strong p-8 text-center text-[14px] font-light text-muted">No structured experience was returned for this CV.</div>

  return (
    <div className="space-y-px bg-hairline">
      {items.map((item, index) => (
        <div key={`${item?.company || 'role'}-${item?.title || index}`} className="grid gap-4 bg-canvas p-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8">
          <div className="text-[12px] leading-[1.4] tracking-[0.5px] text-muted">
            <p>{item?.startDate || item?.startYear || item?.date || '—'}</p>
            {(item?.endDate || item?.endYear) && <p className="mt-1 text-muted-soft">to {item?.endDate || item?.endYear}</p>}
          </div>
          <Card className="border-0 p-0">
            <div className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center border border-hairline bg-surface-card text-primary">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[18px] leading-[1.4] font-bold text-ink">{item?.title || item?.position || item?.role || 'Experience'}</h3>
                <p className="mt-1 text-[15px] font-light text-muted">{item?.company || item?.organization || 'Company not specified'}</p>
                {item?.location && (
                  <p className="mt-3 flex items-center gap-1.5 text-[13px] font-light text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {item.location}
                  </p>
                )}
                {item?.description && <p className="mt-4 text-[15px] leading-[1.55] font-light text-body">{item.description}</p>}
                {safeArray(item.highlights).length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {safeArray(item.highlights).map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-[15px] leading-[1.55] font-light text-body">
                        <span className="mt-2.5 h-px w-3 shrink-0 bg-primary" aria-hidden="true" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
