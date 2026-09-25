import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function SkillBadge({ skill, confidence, onRemove, className, variant = 'default' }) {
  const label = typeof skill === 'string' ? skill : skill?.name || skill?.skill || ''
  if (!label) return null
  return <Badge variant={variant} className={cn('gap-1.5', className)}><span>{label}</span>{confidence !== undefined && <span className="font-normal opacity-65">{Math.round(Number(confidence) > 1 ? Number(confidence) : Number(confidence) * 100)}%</span>}{onRemove && <button type="button" onClick={() => onRemove(label)} className="-mr-1 rounded-full p-0.5 transition hover:bg-black/10 dark:hover:bg-white/10" aria-label={`Remove ${label}`}><X className="h-3 w-3" /></button>}</Badge>
}
