import { ArrowDownRight, ArrowUpRight, GitCompareArrows, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getRecordId, getScore } from '@/lib/utils'
import { getBreakdownScore, normalizeTextList, safeArray, slugify } from '@/lib/normalize'

const defaultKeys = ['contactInformation', 'summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'structure']

const keyAliases = {
  contactinformation: 'contactInformation',
  contact: 'contactInformation',
  contactinfo: 'contactInformation',
  contactdetails: 'contactInformation',
  personalinformation: 'contactInformation',
  professionalsummary: 'summary',
  summary: 'summary',
  skills: 'skills',
  skill: 'skills',
  skillscoverage: 'skills',
  technicalskills: 'skills',
  experience: 'experience',
  workexperience: 'experience',
  employment: 'experience',
  education: 'education',
  projects: 'projects',
  project: 'projects',
  certifications: 'certifications',
  certificates: 'certifications',
  structure: 'structure',
  formatting: 'structure',
  clarity: 'structure',
  completeness: 'structure',
  keywords: 'keywords',
  impact: 'impact',
  achievements: 'impact',
}

const labels = {
  contactInformation: 'Contact information',
  summary: 'Professional summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  structure: 'Structure / clarity',
  keywords: 'Keywords',
  impact: 'Impact',
}

function resolveKey(value) {
  const slug = slugify(value)
  return keyAliases[slug] || slug.replace(/\s+/g, '')
}

function scoreFor(analysis, key) {
  const breakdown = safeArray(analysis?.scoreBreakdown)
  if (breakdown.length) {
    const fromBreakdown = getBreakdownScore(breakdown, [key, labels[key]])
    if (fromBreakdown !== null) return fromBreakdown
  }
  return getScore(analysis?.[key], null)
}

function resolveKeys(first, second) {
  const seen = new Set()
  for (const analysis of [first, second]) {
    for (const item of safeArray(analysis?.scoreBreakdown)) {
      const key = resolveKey(item?.key || item?.label)
      if (key) seen.add(key)
    }
  }
  if (!seen.size) return defaultKeys
  const ordered = defaultKeys.filter((key) => seen.has(key))
  const extra = [...seen].filter((key) => !ordered.includes(key))
  return [...ordered, ...extra]
}

export function AnalysisComparison({ first, second, comparison }) {
  if (!first || !second) return null
  const left = comparison?.first || first
  const right = comparison?.second || second
  const keys = resolveKeys(left, right)
  const firstName = first?.resume?.originalName || first?.resume?.name || first?.resumeName || first?.name || `Version ${getRecordId(first).slice(0, 4) || 'A'}`
  const secondName = second?.resume?.originalName || second?.resume?.name || second?.resumeName || second?.name || `Version ${getRecordId(second).slice(0, 4) || 'B'}`
  const notes = normalizeTextList(comparison?.summary)
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-hairline bg-surface-soft p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-canvas text-primary"><GitCompareArrows className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Side-by-side view</p>
            <h3 className="mt-1 text-[20px] leading-[1.3] font-bold">What changed between versions</h3>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Signal</TableHead>
            <TableHead>{firstName}</TableHead>
            <TableHead>{secondName}</TableHead>
            <TableHead>Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => {
            const firstScore = getScore(scoreFor(left, key), null)
            const secondScore = getScore(scoreFor(right, key), null)
            const comparable = firstScore !== null && secondScore !== null
            const difference = comparable ? Math.round(secondScore - firstScore) : null
            return (
              <TableRow key={key}>
                <TableCell className="font-bold">{labels[key] || key}</TableCell>
                <TableCell><span className="font-bold tabular-nums">{firstScore === null ? '—' : `${firstScore}%`}</span></TableCell>
                <TableCell><span className="font-bold tabular-nums">{secondScore === null ? '—' : `${secondScore}%`}</span></TableCell>
                <TableCell>
                  {difference === null ? <span className="inline-flex items-center gap-1 text-xs text-muted">Not scored</span> : (
                    <span className={difference > 0 ? 'inline-flex items-center gap-1 text-xs font-bold text-success' : difference < 0 ? 'inline-flex items-center gap-1 text-xs font-bold text-error' : 'inline-flex items-center gap-1 text-xs font-bold text-muted'}>
                      {difference > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : difference < 0 ? <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" /> : <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
                      {difference > 0 ? '+' : ''}{difference}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-hairline bg-surface-soft p-4 text-[12px] text-muted">
          {notes.slice(0, 4).map((note) => <span key={note} className="border border-hairline bg-canvas px-2.5 py-1">{note}</span>)}
        </div>
      )}
      {!safeArray(left?.scoreBreakdown).length && !safeArray(right?.scoreBreakdown).length && (
        <div className="border-t border-hairline bg-surface-soft p-4 text-[12px] font-light text-muted">Neither version returned a category breakdown, so only the overall score can be compared.</div>
      )}
    </Card>
  )
}
