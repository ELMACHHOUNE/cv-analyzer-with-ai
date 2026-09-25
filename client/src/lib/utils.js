import { format, formatDistanceToNow, isValid } from 'date-fns'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getRecordId, isPlainRecord, safeArray, toNumber, toScore } from '@/lib/normalize'
import { asText } from '@/lib/normalize'

export { getRecordId, safeArray, toNumber, toScore }

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(value = '') {
  const parts = String(value).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'CV'
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function getFirstName(value = '') {
  return String(value).trim().split(/\s+/)[0] || 'there'
}

export function formatFileSize(bytes = 0) {
  const size = toNumber(bytes)
  if (!size || size <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`
}

export function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—'
  const date = new Date(value)
  if (!isValid(date)) return '—'
  return format(date, pattern)
}

export function formatRelativeDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (!isValid(date)) return '—'
  return `${formatDistanceToNow(date, { addSuffix: true })}`
}

export function uniqueStrings(value) {
  return [...new Set(safeArray(value).map((item) => asText(item)).filter(Boolean))]
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const payload = error?.response?.data
  if (typeof payload === 'string' && payload.trim()) return payload.trim()
  return payload?.message || payload?.error || error?.message || fallback
}

function collectDetails(details) {
  if (!details) return []
  if (Array.isArray(details)) return details.map((entry) => asText(entry)).filter(Boolean)
  if (!isPlainRecord(details)) return []
  const values = []
  for (const [key, value] of Object.entries(details)) {
    if (key === '_form') {
      values.push(...safeArray(value).map((entry) => asText(entry)).filter(Boolean))
      continue
    }
    const text = asText(value)
    if (text) values.push(text)
  }
  return values
}

export function getErrorDetails(error) {
  return collectDetails(error?.details ?? error?.response?.data?.details ?? error?.response?.data?.errors)
}

export function getErrorDetailText(error, fallback = '') {
  const details = getErrorDetails(error)
  return details.length ? details.join(' ') : fallback
}

export function getFieldError(error, field) {
  const details = error?.details ?? error?.response?.data?.details ?? error?.response?.data?.errors
  if (!isPlainRecord(details) && !Array.isArray(details)) return ''
  const direct = details[field]
  if (typeof direct === 'string') return direct
  if (Array.isArray(direct)) return direct.map((entry) => asText(entry)).filter(Boolean).join(' ')
  return getErrorDetailText(error)
}

export function scoreMeta(score) {
  const numericScore = toScore(score)
  if (numericScore === null) return { label: 'Not scored', tone: 'muted', color: 'hsl(215 16% 56%)' }
  if (numericScore >= 85) return { label: 'Excellent', tone: 'success', color: 'hsl(157 64% 42%)' }
  if (numericScore >= 70) return { label: 'Strong', tone: 'info', color: 'hsl(205 90% 48%)' }
  if (numericScore >= 50) return { label: 'Developing', tone: 'warning', color: 'hsl(28 92% 50%)' }
  return { label: 'Needs attention', tone: 'danger', color: 'hsl(2 72% 54%)' }
}

export function getScore(value, fallback = 0) {
  const numericValue = toScore(value)
  return numericValue === null ? fallback : numericValue
}

export function formatPercent(value, fallback = '—') {
  const numericValue = toScore(value)
  if (numericValue === null) return fallback
  return `${Math.round(numericValue)}%`
}
