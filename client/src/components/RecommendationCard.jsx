import { Card } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/text-link'
import { safeArray } from '@/lib/utils'

/* Recommendations are numbered, not decorated — editorial, and scannable. */
export function RecommendationCard({ recommendations = [], title = 'Recommendations', description = 'Suggestions to review, never automatic changes.', limit }) {
  const items = safeArray(recommendations)
  const visibleItems = limit ? items.slice(0, limit) : items

  return (
    <Card className="p-5 sm:p-7">
      <Eyebrow as="p">Next moves</Eyebrow>
      <h2 className="mt-3 text-[20px] leading-[1.3] font-bold">{title}</h2>
      <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">{description}</p>

      {visibleItems.length ? (
        <ol className="mt-7 space-y-px bg-hairline">
          {visibleItems.map((recommendation, index) => {
            const text = typeof recommendation === 'string' ? recommendation : recommendation?.text || recommendation?.title || recommendation?.recommendation
            if (!text) return null
            return (
              <li key={`${text}-${index}`} className="flex gap-5 bg-canvas px-1 py-5">
                <span className="shrink-0 text-[20px] leading-[1.2] font-bold tabular-nums text-primary">{String(index + 1).padStart(2, '0')}</span>
                <p className="text-[15px] leading-[1.6] font-light text-body">{text}</p>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="mt-7 border border-dashed border-hairline-strong p-5 text-[14px] font-light text-muted">No recommendations were returned for this analysis.</p>
      )}
    </Card>
  )
}
