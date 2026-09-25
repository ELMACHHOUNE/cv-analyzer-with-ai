import { describe, expect, it } from 'vitest'
import {
  getRecordId,
  normalizeAnalysis,
  normalizeComparisonPayload,
  normalizeDashboard,
  normalizeMatch,
  normalizeResume,
  normalizeSettings,
  toScore,
} from './normalize'
import { formatPercent, getScore, scoreMeta } from './utils'
import { MAX_RESUME_NAME_LENGTH, truncateResumeName } from './validators'

describe('getRecordId', () => {
  it('accepts plain string identifiers', () => {
    expect(getRecordId('resume-1')).toBe('resume-1')
    expect(getRecordId({ _id: 'resume-2' })).toBe('resume-2')
    expect(getRecordId({ id: 'resume-3' })).toBe('resume-3')
    expect(getRecordId({ resumeId: 'resume-4' })).toBe('resume-4')
  })

  it('returns an empty string for missing records', () => {
    expect(getRecordId(null)).toBe('')
    expect(getRecordId({})).toBe('')
  })
})

describe('toScore', () => {
  it('preserves real zero values and rejects invalid numbers', () => {
    expect(toScore(0)).toBe(0)
    expect(toScore('0')).toBe(0)
    expect(toScore(87.4)).toBe(87.4)
    expect(toScore(null)).toBeNull()
    expect(toScore('abc')).toBeNull()
  })
})

describe('score helpers', () => {
  it('distinguishes missing scores from zero scores', () => {
    expect(getScore({ score: 0 })).toBe(0)
    expect(getScore(null, null)).toBeNull()
    expect(getScore(0, 0)).toBe(0)
    expect(scoreMeta(0).label).toBe('Needs attention')
    expect(scoreMeta(null).label).toBe('Not scored')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(null)).toBe('—')
  })
})

describe('normalizeAnalysis', () => {
  it('reads specification score shapes', () => {
    const analysis = normalizeAnalysis({
      _id: 'a1',
      scores: { overall: { score: 82, label: 'Strong' }, categories: [{ name: 'Skills', score: 70 }] },
      information: { name: 'Ada Lovelace', email: 'ada@example.com' },
      improvements: ['Add metrics'],
    })

    expect(analysis.id).toBe('a1')
    expect(analysis.score).toBe(82)
    expect(analysis.label).toBe('Strong')
    expect(analysis.profile.name).toBe('Ada Lovelace')
    expect(analysis.profile.email).toBe('ada@example.com')
    expect(analysis.recommendations).toEqual(['Add metrics'])
    expect(analysis.scoreBreakdown).toEqual([expect.objectContaining({ key: 'skills', label: 'Skills', score: 70 })])
  })

  it('falls back to legacy native field names', () => {
    const analysis = normalizeAnalysis({
      id: 'a2',
      overallScore: 64,
      scores: [{ category: 'Experience', score: 60 }],
      candidateInfo: { fullName: 'Grace Hopper', emailAddress: 'grace@example.com' },
      improvementSuggestions: [{ suggestion: 'Quantify impact' }],
    })

    expect(analysis.id).toBe('a2')
    expect(analysis.score).toBe(64)
    expect(analysis.profile.name).toBe('Grace Hopper')
    expect(analysis.profile.email).toBe('grace@example.com')
    expect(analysis.recommendations).toEqual(['Quantify impact'])
    expect(analysis.scoreBreakdown[0].score).toBe(60)
  })
})

describe('normalizeMatch', () => {
  it('does not fabricate missing category scores', () => {
    const match = normalizeMatch({ _id: 'm1', score: { overall: 71 }, scoreBreakdown: [{ key: 'skills', score: 55 }] })

    expect(match.id).toBe('m1')
    expect(match.score).toBe(71)
    expect(match.scoreBreakdown).toHaveLength(1)
    expect(match.scoreBreakdown[0]).toMatchObject({ key: 'skills', score: 55 })
    expect(match.categoryScores.experience).toBeNull()
  })

  it('exposes job identifiers and empty evidence defensively', () => {
    const match = normalizeMatch({ _id: 'm2', jobId: 'j1', resumeId: 'r1' })

    expect(match.jobId).toBe('j1')
    expect(match.resumeId).toBe('r1')
    expect(match.matchingExperience).toEqual([])
    expect(match.gaps).toEqual([])
    expect(match.educationCompatibility).toBeNull()
  })
})

describe('normalizeResume', () => {
  it('normalizes a spec-shaped resume', () => {
    const resume = normalizeResume({ _id: 'r1', name: 'Product CV', fileSize: 2048, status: 'ready', createdAt: '2026-01-02T00:00:00.000Z' })

    expect(resume.id).toBe('r1')
    expect(resume.fileSize).toBe(2048)
    expect(resume.status).toBe('processed')
  })
})

describe('normalizeDashboard', () => {
  it('reads specification stat fields and treats silent zero as a real value', () => {
    const dashboard = normalizeDashboard({ data: { stats: { resumes: 0, analyses: 3, averageScore: 0 } } })

    expect(dashboard.totals.resumes).toBe(0)
    expect(dashboard.totals.analyses).toBe(3)
    expect(dashboard.averageScore).toBe(0)
  })
})

describe('normalizeComparisonPayload', () => {
  it('normalizes both sides of a comparison', () => {
    const comparison = normalizeComparisonPayload({ first: { _id: 'a1', overallScore: 70 }, second: { _id: 'a2', scores: { overall: { score: 80 } } } })

    expect(comparison.first.id).toBe('a1')
    expect(comparison.first.score).toBe(70)
    expect(comparison.second.score).toBe(80)
  })

  it('normalizes an analyses array response', () => {
    const comparison = normalizeComparisonPayload({ analyses: [{ _id: 'a1', score: 70 }, { _id: 'a2', score: 80 }] })

    expect(comparison.analyses.map((item) => item.score)).toEqual([70, 80])
    expect(comparison.first.id).toBe('a1')
    expect(comparison.second.id).toBe('a2')
  })
})

describe('normalizeSettings', () => {
  it('coerces the theme to a supported value', () => {
    expect(normalizeSettings({ theme: 'dark' }).theme).toBe('dark')
    expect(normalizeSettings({ theme: 'neon' }).theme).toBe('')
    expect(normalizeSettings({}).theme).toBe('')
  })
})

describe('truncateResumeName', () => {
  it('trims a long name to the maximum length', () => {
    const long = 'x'.repeat(MAX_RESUME_NAME_LENGTH + 40)
    expect(truncateResumeName(long).length).toBe(MAX_RESUME_NAME_LENGTH)
  })

  it('falls back to the file name when no name is provided', () => {
    expect(truncateResumeName('', 'resume.pdf')).toBe('resume.pdf')
    expect(truncateResumeName('   ', 'resume.pdf')).toBe('resume.pdf')
  })
})
