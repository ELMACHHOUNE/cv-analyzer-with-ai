import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BorderBeam({ className }) {
  return <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]', className)}><span className="absolute -left-1/3 top-1/2 h-16 w-1/3 rotate-6 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent blur-sm motion-safe:animate-beam" /></span>
}

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

export function Spotlight({ children, className }) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  return <div onMouseMove={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setPosition({ x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 })
  }} className={cn('group relative isolate overflow-hidden', className)}><div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(500px circle at ${position.x}% ${position.y}%, hsl(190 90% 55% / 0.12), transparent 60%)` }} />{children}</div>
}

export function ShimmerButton({ className, children, ...props }) {
  return <Button className={cn('shimmer-button relative overflow-hidden', className)} {...props}>{children}</Button>
}
