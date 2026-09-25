import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Brain, Check, ExternalLink, FileText, Mail, MapPin, Phone, RefreshCw, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { EducationCard } from '@/components/EducationCard'
import { EmptyState } from '@/components/EmptyState'
import { ExperienceTimeline } from '@/components/ExperienceTimeline'
import { ImprovementDialog } from '@/components/ImprovementDialog'
import { LoadingAnalysis } from '@/components/LoadingAnalysis'
import { PageHeader } from '@/components/PageHeader'
import { RecommendationCard } from '@/components/RecommendationCard'
import { ScoreCard } from '@/components/ScoreCard'
import { SkillBadge } from '@/components/SkillBadge'
import { SkillChart } from '@/components/SkillChart'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analysisApi, resumeApi } from '@/services/api'
import { formatDate, getErrorDetailText, getErrorMessage, getRecordId, safeArray } from '@/lib/utils'
import { asText, normalizeAnalysis, normalizeList, normalizeResume } from '@/lib/normalize'

function InsightPanel({ title, items, tone = 'default', icon: Icon = Check, emptyLabel }) {
  const values = safeArray(items).filter(Boolean)
  const accent = tone === 'warning' ? 'border-l-warning' : tone === 'danger' ? 'border-l-error' : 'border-l-success'
  const iconTone = tone === 'warning' ? 'text-warning-foreground' : tone === 'danger' ? 'text-error' : 'text-success-foreground'
  return (
    <Card className={`border-l-2 p-5 ${accent} ${values.length ? '' : 'border-dashed'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconTone}`} aria-hidden="true" />
        <h3 className="text-[16px] font-bold">{title}</h3>
      </div>
      {values.length ? (
        <ul className="mt-5 space-y-4">
          {values.map((item, index) => (
            <li key={`${item.item || item}-${index}`} className="text-[14px] leading-[1.55] font-light text-body">
              <span className="flex gap-3">
                <span className="mt-2.5 h-px w-3 shrink-0 bg-current opacity-40" aria-hidden="true" />
                <span>
                  {item.item && <span className="font-bold text-ink">{item.item}</span>}
                  {item.explanation && <span className={item.item ? ' block' : ''}>{item.explanation}</span>}
                  {safeArray(item.evidence).length > 0 && <span className="mt-1 block text-[12px] text-muted">{safeArray(item.evidence).slice(0, 2).join(' · ')}</span>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] font-light text-muted">{emptyLabel || `No ${title.toLowerCase()} were returned.`}</p>
      )}
    </Card>
  )
}

function TextPanel({ title, items, description, emptyLabel, icon: Icon = Check }) {
  const values = safeArray(items).filter(Boolean)
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <h2 className="text-[18px] leading-[1.3] font-bold">{title}</h2>
          {description && <p className="mt-1 text-[13px] font-light text-muted">{description}</p>}
        </div>
      </div>
      {values.length ? (
        <ul className="mt-6 space-y-3">
          {values.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3 text-[14px] leading-[1.55] font-light text-body">
              <span className="mt-2.5 h-px w-3 shrink-0 bg-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 border border-dashed border-hairline-strong p-5 text-[14px] font-light text-muted">{emptyLabel}</p>
      )}
    </Card>
  )
}

function ProjectList({ projects = [] }) {
  const items = safeArray(projects)
  if (!items.length) return <div className="border border-dashed border-hairline-strong p-8 text-center text-[14px] font-light text-muted">No projects were returned for this CV.</div>
  return (
    <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2">
      {items.map((project, index) => (
        <Card key={`${project.name}-${index}`} tone="soft" className="border-0 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[16px] font-bold text-ink">{project.name || 'Project'}</h3>
            <Badge variant="outline">Project</Badge>
          </div>
          {project.role && <p className="mt-1 text-[12px] tracking-[0.5px] text-muted">{project.role}</p>}
          {project.description && <p className="mt-3 text-[14px] leading-[1.55] font-light text-body">{project.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {safeArray(project.technologies).map((technology) => <SkillBadge key={technology} skill={technology} />)}
            {safeArray(project.skills).map((skill) => <SkillBadge key={skill} skill={skill} />)}
          </div>
          {project.url && <a href={project.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline">View project <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
        </Card>
      ))}
    </div>
  )
}

function ProfileCard({ profile = {} }) {
  const links = safeArray(profile.links)
  const fields = [
    { label: 'Name', value: profile.fullName || profile.name, icon: UserRound },
    { label: 'Email', value: profile.email, icon: Mail },
    { label: 'Phone', value: profile.phone, icon: Phone },
    { label: 'Location', value: profile.location, icon: MapPin },
  ]
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="label-uppercase text-primary">Profile</p>
          <h2 className="mt-3 text-[18px] leading-[1.3] font-bold">The person behind the CV</h2>
        </div>
      </div>
      <dl className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3 bg-canvas p-4">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="label-uppercase text-muted">{label}</dt>
              <dd className="mt-2 break-words text-[14px] font-bold text-ink">{value || 'Not provided'}</dd>
            </div>
          </div>
        ))}
      </dl>
      {links.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-4 border-t border-hairline pt-5">
          {links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:underline">{link.label}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>)}
        </div>
      )}
      {profile.summary && <div className="mt-5 border-t border-hairline pt-5"><p className="label-uppercase text-muted">Professional summary</p><p className="mt-3 text-[15px] leading-[1.55] font-light text-body">{profile.summary}</p></div>}
    </Card>
  )
}

export function ResumeAnalysis() {
  const { analysisId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedResumeId = searchParams.get('resumeId')
  const [analysis, setAnalysis] = useState(null)
  const [resume, setResume] = useState(null)
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [runRequested, setRunRequested] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    let nextAnalysis
    let nextResume
    try {
      if (analysisId) {
        nextAnalysis = await analysisApi.get(analysisId)
      } else if (requestedResumeId) {
        try {
          nextAnalysis = await analysisApi.latest(requestedResumeId)
        } catch {
          const list = normalizeList(await analysisApi.list({ resumeId: requestedResumeId }), 'analyses')
          nextAnalysis = list.find((item) => getRecordId(item?.resume || item?.resumeId) === requestedResumeId) || list[0] || null
        }
        try {
          nextResume = await resumeApi.get(requestedResumeId)
        } catch {
          nextResume = null
        }
      } else {
        try {
          nextAnalysis = await analysisApi.latest()
        } catch {
          nextAnalysis = null
        }
        if (!nextAnalysis) nextAnalysis = normalizeList(await analysisApi.list({ limit: 1 }), 'analyses')[0] || null
      }
      if (nextAnalysis?.resume && !nextResume) nextResume = nextAnalysis.resume
      setAnalysis(normalizeAnalysis(nextAnalysis))
      setResume(normalizeResume(nextResume))
    } catch (loadError) {
      setError([getErrorMessage(loadError, 'This analysis could not be loaded.'), getErrorDetailText(loadError)].filter(Boolean).join(' '))
    } finally {
      setLoading(false)
    }
    try {
      setResumes(normalizeList(await resumeApi.list({ limit: 100 }), 'resumes').map(normalizeResume).filter(Boolean))
    } catch {
      setResumes([])
    }
  }

  useEffect(() => {
    load()
  }, [analysisId, requestedResumeId])

  const requestAnalysis = async () => {
    if (!requestedResumeId) return
    setRunRequested(true)
    try {
      const created = await analysisApi.create(requestedResumeId)
      const normalized = normalizeAnalysis(created)
      if (normalized) {
        setAnalysis(normalized)
        toast.success('Analysis is ready.')
        if (normalized.id) navigate(`/analysis/${normalized.id}`, { replace: true })
      } else {
        toast.success('Analysis request queued.')
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'The analysis request failed.'))
    } finally {
      setRunRequested(false)
    }
  }

  const displayName = resume?.name || resume?.originalName || analysis?.resumeName || analysis?.resume?.originalName || 'Untitled CV'
  const breakdown = useMemo(() => safeArray(analysis?.scoreBreakdown).map((item) => ({ label: item.label, value: item.score })), [analysis])

  if (loading) return <div><PageHeader eyebrow="CV analysis" title="Reading your CV" description="We are loading the latest structured review." /><LoadingAnalysis progress={45} /></div>

  if (error) return (
    <div>
      <PageHeader eyebrow="CV analysis" title="We could not open this review" />
      <Alert variant="destructive">
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Analysis unavailable</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>Try again</Button>
        </AlertDescription>
      </Alert>
    </div>
  )

  if (!analysis) return (
    <div>
      <PageHeader
        eyebrow="CV analysis"
        title={requestedResumeId ? 'Your CV is still processing' : 'No analysis yet'}
        description={requestedResumeId ? 'The upload was received, but the API has not returned structured analysis data yet.' : 'Upload a CV or run an analysis to see your structured review here.'}
        action={<Button asChild><Link to="/upload">Upload a CV</Link></Button>}
      />
      {requestedResumeId ? (
        <div className="space-y-5">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary"><FileText className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[16px] font-bold">{displayName}</p>
                <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">The server has not returned an analysis for this version yet.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={requestAnalysis} disabled={runRequested}>{runRequested ? 'Requesting…' : 'Request analysis'}</Button>
              <Button variant="outline" asChild><Link to="/upload">Upload another version</Link></Button>
            </div>
          </Card>
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>Document processing and analysis are server-side steps. This page will not claim they are complete until the API returns the structured result.</AlertDescription>
          </Alert>
        </div>
      ) : (
        <EmptyState icon={FileText} title="No analysis to show" description="Your saved analyses will appear here once the API returns a structured result." action={<Button asChild><Link to="/upload">Upload your first CV</Link></Button>} />
      )}
    </div>
  )

  return (
    <div>
      <PageHeader eyebrow="CV analysis" title={displayName} description={`An evidence-led view of your CV — ${formatDate(analysis.createdAt)}`} action={<div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/history">All analyses</Link></Button><ImprovementDialog analysisId={analysis.id} /></div>} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[12px] tracking-[0.5px] text-muted">
          <span className="h-1.5 w-1.5 bg-success" aria-hidden="true" />
          Analysis data returned by your API
        </p>
        {resumes.length > 0 && (
          <Select value={getRecordId(resume) || requestedResumeId || ''} onValueChange={(value) => value && navigate(`/analysis?resumeId=${encodeURIComponent(value)}`)}>
            <SelectTrigger className="w-full sm:w-64" aria-label="Choose a CV analysis"><SelectValue placeholder="Choose a CV version" /></SelectTrigger>
            <SelectContent>
              {resumes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name || item.originalName || 'Untitled CV'}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <ScoreCard score={analysis.score} breakdown={breakdown} />
            <ProfileCard profile={analysis.profile} />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <InsightPanel title="Strengths" items={analysis.strengths} />
            <InsightPanel title="Weaknesses" items={analysis.weaknesses} tone="warning" icon={AlertCircle} />
            <InsightPanel title="Missing information" items={analysis.missingInformation} tone="danger" icon={AlertCircle} emptyLabel="No missing sections were reported." />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <TextPanel title="Strong points" items={analysis.explanation.strongPoints} description="Taken from the written explanation the analysis returned." emptyLabel="The API did not return strong points in prose form." icon={Sparkles} />
            <TextPanel title="Areas to improve" items={analysis.explanation.areasToImprove} description="The same explanation, read as a checklist." emptyLabel="The API did not return areas to improve in prose form." icon={Brain} />
          </div>
          <RecommendationCard recommendations={analysis.recommendations} />
        </TabsContent>
        <TabsContent value="skills" className="mt-6 space-y-5">
          <SkillChart skills={analysis.skills} categories={analysis.categories} />
          <div className="grid gap-px border border-hairline bg-hairline lg:grid-cols-3">
            <Card tone="soft" className="border-0 p-5">
              <h2 className="text-[16px] font-bold">Technical skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {safeArray(analysis.technicalSkills).length ? safeArray(analysis.technicalSkills).map((skill) => <SkillBadge key={skill} skill={skill} />) : <p className="text-[14px] font-light text-muted">No technical skills were returned separately.</p>}
              </div>
            </Card>
            <Card tone="soft" className="border-0 p-5">
              <h2 className="text-[16px] font-bold">Soft skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {safeArray(analysis.softSkills).length ? safeArray(analysis.softSkills).map((skill) => <SkillBadge key={skill} skill={skill} variant="success" />) : <p className="text-[14px] font-light text-muted">No soft skills were returned separately.</p>}
              </div>
            </Card>
            <Card tone="soft" className="border-0 p-5">
              <h2 className="text-[16px] font-bold">Technologies</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {safeArray(analysis.technologies).length ? safeArray(analysis.technologies).map((technology) => <SkillBadge key={technology} skill={technology} variant="outline" />) : <p className="text-[14px] font-light text-muted">No technologies were returned separately.</p>}
              </div>
            </Card>
          </div>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-bold">Detected skills</h2>
                <p className="mt-1 text-[13px] font-light text-muted">Structured skills returned by the analysis.</p>
              </div>
              <Badge variant="outline">{safeArray(analysis.skills).length} signals</Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {safeArray(analysis.skills).length ? safeArray(analysis.skills).map((skill, index) => <SkillBadge key={`${asText(skill)}-${index}`} skill={skill} confidence={typeof skill === 'object' ? skill?.confidence ?? skill?.level : undefined} />) : <p className="text-[14px] font-light text-muted">No skills were returned.</p>}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="experience" className="mt-6"><ExperienceTimeline experience={analysis.experience} /></TabsContent>
        <TabsContent value="education" className="mt-6"><EducationCard education={analysis.education} /></TabsContent>
        <TabsContent value="projects" className="mt-6"><ProjectList projects={analysis.projects} /></TabsContent>
        <TabsContent value="certifications" className="mt-6 space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-[18px] leading-[1.3] font-bold">Certifications</h2>
                <p className="mt-1 text-[13px] font-light text-muted">Credentials included in the CV analysis.</p>
              </div>
            </div>
            {safeArray(analysis.certifications).length ? (
              <div className="mt-6 grid gap-px border border-hairline bg-hairline md:grid-cols-2">
                {safeArray(analysis.certifications).map((certification, index) => (
                  <div key={`${certification.name}-${index}`} className="bg-canvas p-4">
                    <p className="text-[15px] font-bold text-ink">{certification.name || 'Certification'}</p>
                    {(certification.issuer || certification.date) && <p className="mt-1 text-[12px] tracking-[0.5px] text-muted">{[certification.issuer, certification.date].filter(Boolean).join(' · ')}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="mt-6 border border-dashed border-hairline-strong p-6 text-[14px] font-light text-muted">No certifications were returned for this analysis.</p>}
          </Card>
          <TextPanel title="Languages" items={safeArray(analysis.languages).map((item) => item.name)} description="Spoken languages recorded in the CV." emptyLabel="No languages were returned for this analysis." />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-6 space-y-6">
          <RecommendationCard recommendations={analysis.recommendations} title="Next improvements" />
          <TextPanel title="Achievements" items={safeArray(analysis.achievements).map((item) => item.name)} description="Wins the analysis surfaced from the CV." emptyLabel="No achievements were returned for this analysis." />
          <Card className="flex flex-col gap-5 border-l-2 border-l-primary p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-[16px] font-bold">Keep the source in control</p>
                <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">Use suggestions as a review list. Your uploaded CV is never changed by this page.</p>
              </div>
            </div>
            <ImprovementDialog analysisId={analysis.id} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
