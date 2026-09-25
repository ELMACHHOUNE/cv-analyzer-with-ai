import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function SkillBadge({ skill, confidence, onRemove, className, variant = 'outline' }) {
  const label = typeof skill === 'string' ? skill : skill?.name || skill?.skill || ''
  if (!label) return null
  return (
    <Badge variant={variant} className={cn('rounded-xs', className)}>
      <span>{label}</span>
      {confidence !== undefined && <span className="font-normal opacity-70">{Math.round(Number(confidence) > 1 ? Number(confidence) : Number(confidence) * 100)}%</span>}
      {onRemove && (
        <button type="button" onClick={() => onRemove(label)} className="-mr-1 grid h-4 w-4 place-items-center transition-colors hover:bg-on-dark/15" aria-label={`Remove ${label}`}>
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </Badge>
  )
}
