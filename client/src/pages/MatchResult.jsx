import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, CircleAlert, ExternalLink, FileText, Info, RefreshCw, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { JobMatchCard } from '@/components/JobMatchCard'
import { PageHeader } from '@/components/PageHeader'
import { RecommendationCard } from '@/components/RecommendationCard'
import { SkillBadge } from '@/components/SkillBadge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { matchApi } from '@/services/api'
import { formatDate, getErrorDetailText, getErrorMessage, getRecordId, getScore, safeArray, scoreMeta } from '@/lib/utils'
import { normalizeList, normalizeMatch } from '@/lib/normalize'

const categoryLabels = {
  skills: 'Skills alignment',
  experience: 'Experience',
  education: 'Education',
  keywords: 'Keywords',
  impact: 'Impact',
  completeness: 'Completeness',
}

function EducationCompatibility({ value }) {
  if (!value) return <p className="text-sm text-muted-foreground">The API did not return an education compatibility value.</p>
  const score = getScore(value.score, null)
  return (
    <div className="space-y-4">
      {score !== null && (
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compatibility score</span>
            <span className="font-semibold text-foreground">{score}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${score}%` }} />
          </div>
        </div>
      )}
      {value.label && <Badge variant="outline">{value.label}</Badge>}
      {value.explanation && <p className="text-sm leading-6 text-foreground/80">{value.explanation}</p>}
      {safeArray(value.evidence).length > 0 && (
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {safeArray(value.evidence).map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{item}</li>)}
        </ul>
      )}
    </div>
  )
}

function MatchEvidence({ title, items, positive = true, renderItem }) {
  const values = safeArray(items)
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        {positive ? <CheckCircle2 className="h-4 w-4 text-success" /> : <CircleAlert className="h-4 w-4 text-warning" />}
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      {values.length ? (
        <div className="mt-4 space-y-2">
          {values.map((item, index) => renderItem ? renderItem(item, index) : <SkillBadge key={`${item}-${index}`} skill={item} variant={positive ? 'success' : 'warning'} />)}
        </div>
      ) : <p className="mt-4 text-sm text-muted-foreground">No items returned.</p>}
    </Card>
  )
}

function EvidenceList({ title, items, positive }) {
  return (
    <MatchEvidence title={title} items={items} positive={positive} renderItem={(item, index) => (
      <div key={`${item.item}-${index}`} className="rounded-xl border border-border/70 bg-muted/25 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{item.item}</span>
          {item.importance && <Badge variant={positive ? 'success' : 'warning'}>{item.importance}</Badge>}
        </div>
        {item.explanation && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.explanation}</p>}
      </div>
    )} />
  )
}

export function MatchResult() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      if (matchId) {
        setMatch(normalizeMatch(await matchApi.get(matchId)))
      } else {
        setMatches(normalizeList(await matchApi.list(), 'matches').map(normalizeMatch).filter(Boolean))
      }
    } catch (loadError) {
      setError([getErrorMessage(loadError, 'The match result could not be loaded.'), getErrorDetailText(loadError)].filter(Boolean).join(' '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [matchId])

  const categoryScores = useMemo(() => Object.entries(match?.categoryScores || {}).map(([key, value]) => ({ key, label: categoryLabels[key] || key, value })).filter((item) => item.value !== null), [match])
  const explainedBreakdown = useMemo(() => safeArray(match?.scoreBreakdown).filter((item) => item.explanation), [match])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )

  if (error) return (
    <div>
      <PageHeader eyebrow="Match results" title="Result unavailable" />
      <Alert variant="destructive">
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Could not load this result</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>Try again</Button>
        </AlertDescription>
      </Alert>
    </div>
  )

  if (!matchId) return (
    <div>
      <PageHeader eyebrow="Match results" title="Saved compatibility checks" description="Return to a role to see the evidence behind its score." action={<Button asChild><Link to="/jobs"><Target className="h-4 w-4" /> New match</Link></Button>} />
      {matches.length ? (
        <div className="grid gap-4 lg:grid-cols-2">{matches.map((item) => <JobMatchCard key={getRecordId(item) || item.job?.title} match={item} />)}</div>
      ) : (
        <EmptyState icon={Target} title="No saved matches" description="Run a CV against a role description to create your first result." action={<Button asChild><Link to="/jobs">Open job matcher</Link></Button>} />
      )}
    </div>
  )

  if (!match) return (
    <div>
      <PageHeader eyebrow="Match results" title="Match not found" />
      <EmptyState icon={Target} title="This result is not available" description="The API did not return a match for this identifier." action={<Button asChild><Link to="/matches">Back to saved matches</Link></Button>} />
    </div>
  )

  const job = match.job || {}
  const meta = scoreMeta(match.score)
  const score = getScore(match.score, null)
  return (
    <div>
      <PageHeader backTo="/matches" eyebrow="Compatibility result" title={job.title || 'Job match'} description={[job.company || 'Company not specified', job.location, formatDate(match.createdAt)].filter(Boolean).join(' · ')} action={<Button variant="outline" asChild><Link to="/jobs"><ArrowLeft className="h-4 w-4" /> Match another role</Link></Button>} />
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <Card className="relative overflow-hidden border-primary/20 bg-ink p-6 text-white sm:p-8">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex items-center gap-2 text-cyan-200">
            <Target className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Compatibility</span>
          </div>
          <div className="relative mt-8 flex items-end gap-3">
            <span className="font-display text-7xl font-semibold leading-none tracking-[-0.09em]">{score === null ? '—' : score}<span className="text-2xl text-slate-400">%</span></span>
          </div>
          <p className="relative mt-3 text-sm text-slate-300">{meta.label} alignment with this role</p>
          {categoryScores.length > 0 ? (
            <div className="relative mt-8 space-y-4">
              {categoryScores.map((item) => (
                <div key={item.key}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, item.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="relative mt-8 text-xs leading-5 text-slate-400">The API did not return category scores for this match, so only the overall compatibility is shown.</p>
          )}
          <p className="relative mt-7 flex gap-2 text-xs leading-5 text-slate-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Directional compatibility signal, not a hiring decision.</p>
        </Card>
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Why this score?</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">The evidence in plain English</h2>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-foreground/80">{match.explanation || 'The API did not return a written explanation for this match. Review the breakdown and evidence below instead.'}</p>
          {explainedBreakdown.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {explainedBreakdown.map((item) => (
                <li key={item.key || item.label} className="flex gap-2.5 text-sm leading-6 text-foreground/80">
                  <span className="mt-0.5 shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">{item.score}%</span>
                  <span><span className="font-medium text-foreground">{item.label}:</span> {item.explanation}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-success/20 bg-success/5 p-3">
              <p className="text-xs text-muted-foreground">Matching skills</p>
              <p className="mt-2 font-display text-2xl font-semibold text-success">{safeArray(match.matchingSkills).length}</p>
            </div>
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
              <p className="text-xs text-muted-foreground">Missing skills</p>
              <p className="mt-2 font-display text-2xl font-semibold text-warning-foreground">{safeArray(match.missingSkills).length}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Keywords</p>
              <p className="mt-2 font-display text-2xl font-semibold text-primary">{safeArray(match.keywordMatches).length}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Gaps</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{safeArray(match.gaps).length}</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <MatchEvidence title="Strong matches" items={match.strongMatches} renderItem={(item, index) => (
          <div key={`${item.item}-${index}`} className="rounded-xl border border-success/20 bg-success/5 p-3">
            <p className="text-sm font-medium text-foreground">{item.item}</p>
            {item.explanation && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.explanation}</p>}
          </div>
        )} />
        <MatchEvidence title="Gaps to close" items={match.gaps} positive={false} renderItem={(item, index) => (
          <div key={`${item.item}-${index}`} className="rounded-xl border border-warning/20 bg-warning/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <TriangleAlert className="h-3.5 w-3.5 text-warning" />
              <span className="text-sm font-medium text-foreground">{item.item}</span>
              {item.importance && <Badge variant="warning">{item.importance}</Badge>}
            </div>
            {item.explanation && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.explanation}</p>}
          </div>
        )} />
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <MatchEvidence title="Matching skills" items={match.matchingSkills} />
        <MatchEvidence title="Skills to explore" items={match.missingSkills} positive={false} />
        <EvidenceList title="Matching experience" items={match.matchingExperience} positive />
        <EvidenceList title="Experience gaps" items={match.missingExperience} positive={false} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Education compatibility</h2>
          </div>
          <div className="mt-5"><EducationCompatibility value={match.educationCompatibility} /></div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Keyword matches</h2>
          </div>
          {safeArray(match.keywordMatches).length ? (
            <div className="mt-5 flex flex-wrap gap-2">{safeArray(match.keywordMatches).map((keyword) => <Badge key={keyword} variant="outline" className="bg-primary/[0.03] text-foreground">{keyword}</Badge>)}</div>
          ) : <p className="mt-5 text-sm text-muted-foreground">No keyword matches were returned.</p>}
          {safeArray(match.additionalSkills).length > 0 && (
            <p className="mt-5 text-xs text-muted-foreground">Also on your CV: {safeArray(match.additionalSkills).slice(0, 8).join(', ')}</p>
          )}
          {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Open original role <ExternalLink className="h-3.5 w-3.5" /></a>}
        </Card>
      </div>
      <div className="mt-6">
        <RecommendationCard recommendations={match.recommendations} title="Recommendations for this role" />
      </div>
    </div>
  )
}
