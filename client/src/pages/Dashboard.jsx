import { useEffect, useState } from 'react'
import { BriefcaseBusiness, FileText, RefreshCw, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { JobMatchCard } from '@/components/JobMatchCard'
import { PageHeader } from '@/components/PageHeader'
import { StatCell } from '@/components/StatCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActionLink, Eyebrow } from '@/components/ui/text-link'
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

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

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
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${getFirstName(user?.name)}.`}
        description="Your private workspace for clearer CVs and more intentional applications."
        action={<Button asChild><Link to="/upload"><Upload className="h-4 w-4" aria-hidden="true" /> Analyze a CV</Link></Button>}
      />

      {error && (
        <Alert variant="destructive" className="mb-8">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Some workspace data could not load</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadDashboard}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 xl:grid-cols-3">
        <StatCell label="Average CV score" value={formatPercent(averageScore)} detail="Across saved analyses" />
        <StatCell label="Highest score" value={formatPercent(highestScore)} detail="Your best result so far" />
        <StatCell label="CVs in workspace" value={totalResumes} detail="Ready for a closer look" />
        <StatCell label="Analyses run" value={totalAnalyses} detail="Your saved review history" />
        <StatCell label="Roles tracked" value={totalJobs} detail={`${totalMatches} compatibility ${totalMatches === 1 ? 'check' : 'checks'}`} />
        <StatCell label="Average match" value={formatPercent(averageMatch)} detail={latestScore === null ? 'Across saved job matches' : `Latest CV score ${Math.round(latestScore)}%`} />
      </div>

      <div className="mt-12 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <Eyebrow as="p">Recent analyses</Eyebrow>
              <h2 className="mt-3 text-[24px] leading-[1.25] font-bold">Your latest CV reads</h2>
            </div>
            <Link to="/history" className="inline-flex min-h-11 items-center"><ActionLink>View history</ActionLink></Link>
          </div>

          {recentAnalyses.length ? (
            <ul className="mt-2 space-y-px bg-hairline">
              {recentAnalyses.map((analysis) => {
                const id = getRecordId(analysis)
                return (
                  <li key={id || analysis.resumeName}>
                    <Link
                      to={id ? `/analysis/${id}` : '/analysis'}
                      className="flex items-center gap-4 bg-canvas px-1 py-4 transition-colors duration-150 hover:bg-surface-soft"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-ink">{analysis.resumeName || analysis.name || 'Untitled analysis'}</span>
                        <span className="mt-1 block text-[13px] font-light text-muted">{formatRelativeDate(analysis.createdAt)}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[22px] leading-[1.2] font-bold tabular-nums text-ink">{formatPercent(analysis.score)}</span>
                        <span className="label-uppercase text-muted-soft">score</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState compact className="mt-6" icon={FileText} title="No analyses yet" description="Upload a CV to create your first structured review." action={<Button size="sm" asChild><Link to="/upload">Upload CV</Link></Button>} />
          )}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <Eyebrow as="p">Recent matches</Eyebrow>
              <h2 className="mt-3 text-[24px] leading-[1.25] font-bold">Roles you explored</h2>
            </div>
            <Link to="/matches" className="inline-flex min-h-11 items-center"><ActionLink>View all</ActionLink></Link>
          </div>
          {recentMatches.length ? (
            <div className="mt-6 space-y-4">
              {recentMatches.map((match) => <JobMatchCard key={getRecordId(match) || match.job?.title} match={match} />)}
            </div>
          ) : (
            <EmptyState compact className="mt-6" icon={BriefcaseBusiness} title="No matches yet" description="Compare a CV with a role description when you are ready." action={<Button size="sm" asChild><Link to="/jobs">Open matcher</Link></Button>} />
          )}
        </section>
      </div>

      <Card className="mt-12 border-l-2 border-l-primary p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[18px] font-bold">Small improvement, compounding clarity.</p>
            <p className="mt-2 max-w-2xl text-[15px] leading-[1.55] font-light text-muted">Use the recommendations in an analysis as a review list, then upload your next version when you are ready.</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0"><Link to="/history">Review saved insights</Link></Button>
        </div>
      </Card>
    </div>
  )
}
