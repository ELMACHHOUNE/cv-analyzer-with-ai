import { useEffect, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, RefreshCw, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { JobMatchCard } from '@/components/JobMatchCard'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { analysisApi, dashboardApi, matchApi, resumeApi } from '@/services/api'
import { formatPercent, formatRelativeDate, getErrorMessage, getFirstName, getRecordId, getScore } from '@/lib/utils'
import { averageScoreOf, normalizeAnalysis, normalizeList, normalizeMatch, normalizeResume } from '@/lib/normalize'

const emptyState = { dashboard: null, analyses: [], matches: [], resumes: [] }

function resolveCount(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (Array.isArray(value)) return value.length
  }
  return 0
}

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    const [statsResult, analysesResult, matchesResult, resumesResult] = await Promise.allSettled([
      dashboardApi.stats(),
      analysisApi.list({ limit: 20 }),
      matchApi.list({ limit: 20 }),
      resumeApi.list({ limit: 100 }),
    ])
    const failed = [statsResult, analysesResult, matchesResult, resumesResult].filter((result) => result.status === 'rejected')
    if (!failed.length) setError('')
    else if (failed.length === 4) setError(getErrorMessage(failed[0].reason, 'Your workspace could not be loaded right now.'))
    setData({
      dashboard: statsResult.status === 'fulfilled' ? statsResult.value : null,
      analyses: normalizeList(analysesResult.status === 'fulfilled' ? analysesResult.value : null, 'analyses').map(normalizeAnalysis).filter(Boolean),
      matches: normalizeList(matchesResult.status === 'fulfilled' ? matchesResult.value : null, 'matches').map(normalizeMatch).filter(Boolean),
      resumes: normalizeList(resumesResult.status === 'fulfilled' ? resumesResult.value : null, 'resumes').map(normalizeResume).filter(Boolean),
    })
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-[28rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}</div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )

  const dashboard = data.dashboard
  const serverAnalyses = dashboard?.recentAnalyses?.length ? dashboard.recentAnalyses.map(normalizeAnalysis).filter(Boolean) : []
  const serverMatches = (dashboard?.recentMatches?.length ? dashboard.recentMatches : dashboard?.topMatches?.length ? dashboard.topMatches : []).map(normalizeMatch).filter(Boolean)
  const recentAnalyses = (serverAnalyses.length ? serverAnalyses : data.analyses).slice(0, 3)
  const recentMatches = (serverMatches.length ? serverMatches : data.matches).slice(0, 2)

  const averageScore = dashboard?.averageScore ?? averageScoreOf(data.analyses)
  const highestScore = dashboard?.highestScore ?? (data.analyses.length ? Math.max(...data.analyses.map((item) => getScore(item.score, 0))) : null)
  const averageMatch = dashboard?.averageMatch ?? averageScoreOf(data.matches)
  const latestScore = dashboard?.latestScore ?? getScore(data.analyses[0]?.score, null)
  const totalResumes = resolveCount(dashboard?.totals?.resumes, data.resumes.length)
  const totalAnalyses = resolveCount(dashboard?.totals?.analyses, data.analyses.length)
  const totalMatches = resolveCount(dashboard?.totals?.matches, data.matches.length)
  const totalJobs = dashboard?.totals?.jobs ?? 0

  return (
    <div>
      <PageHeader eyebrow="Overview" title={`Good to see you, ${getFirstName(user?.name)}.`} description="Your private workspace for clearer CVs and more intentional applications." action={<Button asChild><Link to="/upload"><Sparkles className="h-4 w-4" /> Analyze a CV</Link></Button>} />
      {error && (
        <Alert variant="destructive" className="mb-6">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Some workspace data could not load</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadDashboard}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average CV score" value={formatPercent(averageScore)} detail="Across saved analyses" icon={TrendingUp} tone="blue" />
        <StatCard label="Highest score" value={formatPercent(highestScore)} detail="Your best result so far" icon={Trophy} tone="green" />
        <StatCard label="CVs in workspace" value={totalResumes} detail="Ready for a closer look" icon={FileText} tone="cyan" />
        <StatCard label="Analyses run" value={totalAnalyses} detail="Your saved review history" icon={CheckCircle2} tone="green" />
        <StatCard label="Roles tracked" value={totalJobs} detail={`${totalMatches} compatibility ${totalMatches === 1 ? 'check' : 'checks'}`} icon={BriefcaseBusiness} tone="amber" />
        <StatCard label="Average match" value={formatPercent(averageMatch)} detail={latestScore === null ? 'Across saved job matches' : `Latest CV score ${Math.round(latestScore)}%`} icon={Target} tone="amber" />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Recent analyses</p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Your latest CV reads</h2>
            </div>
            <Link to="/history" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View history <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentAnalyses.length ? (
            <div className="mt-6 space-y-3">
              {recentAnalyses.map((analysis) => {
                const id = getRecordId(analysis)
                return (
                  <Link key={id || analysis.resumeName} to={id ? `/analysis/${id}` : '/analysis'} className="flex items-center gap-4 rounded-xl border border-border/70 p-3.5 transition hover:border-primary/30 hover:bg-primary/[0.03]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{analysis.resumeName || analysis.name || 'Untitled analysis'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(analysis.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-foreground">{formatPercent(analysis.score)}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">score</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState compact className="mt-6" icon={FileText} title="No analyses yet" description="Upload a CV to create your first structured review." action={<Button size="sm" asChild><Link to="/upload">Upload CV</Link></Button>} />
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Recent matches</p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Roles you explored</h2>
            </div>
            <Link to="/matches" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentMatches.length ? (
            <div className="mt-6 space-y-3">{recentMatches.map((match) => <JobMatchCard key={getRecordId(match) || match.job?.title} match={match} />)}</div>
          ) : (
            <EmptyState compact className="mt-6" icon={BriefcaseBusiness} title="No matches yet" description="Compare a CV with a role description when you are ready." action={<Button size="sm" asChild><Link to="/jobs">Open matcher</Link></Button>} />
          )}
        </Card>
      </div>
      <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="font-semibold text-foreground">Small improvement, compounding clarity.</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Use the recommendations in an analysis as a review list, then upload your next version when you are ready.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/history">Review saved insights</Link></Button>
        </div>
      </div>
    </div>
  )
}
