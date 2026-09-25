import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/* The system does not use glow, beams or spotlights. Motion stays quiet:
   a number that counts up, and a single restrained entrance. */
export function NumberTicker({ value = 0, suffix = '', prefix = '', className }) {
  const numericValue = Number(value)
  const [displayValue, setDisplayValue] = useState(Number.isFinite(numericValue) ? 0 : value)

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(value)
      return undefined
    }
    let frame
    const startedAt = performance.now()
    const duration = 900
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(Math.round(numericValue * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [numericValue, value])

  return <span className={cn('tabular-nums', className)}>{prefix}{Number.isFinite(numericValue) ? displayValue : value}{suffix}</span>
}

export function Reveal({ className, delay = 0, ...props }) {
  return <div className={cn('animate-rise motion-reduce:animate-none', className)} style={{ animationDelay: `${delay}ms` }} {...props} />
}
