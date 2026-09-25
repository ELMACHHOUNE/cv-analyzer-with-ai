import { useEffect, useState } from 'react'
import { BriefcaseBusiness, MoreHorizontal, Pencil, RefreshCw, Sparkles, Trash2, WandSparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/EmptyState'
import { JobForm } from '@/components/JobForm'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { jobApi, matchApi, resumeApi } from '@/services/api'
import { getErrorMessage } from '@/lib/utils'
import { normalizeJob, normalizeList, normalizeResume } from '@/lib/normalize'
import { hasErrors, validateJobForm } from '@/lib/validators'

const emptyForm = { title: '', company: '', location: '', url: '', description: '' }

export function JobMatcher() {
  const navigate = useNavigate()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [editingJob, setEditingJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [analyzingId, setAnalyzingId] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobResponse, resumeResponse] = await Promise.all([jobApi.list({ limit: 50 }), resumeApi.list({ limit: 100 })])
      const nextJobs = normalizeList(jobResponse, 'jobs').map(normalizeJob).filter(Boolean)
      const nextResumes = normalizeList(resumeResponse, 'resumes').map(normalizeResume).filter(Boolean)
      setJobs(nextJobs)
      setResumes(nextResumes)
      setSelectedResume((current) => current || nextResumes[0]?.id || '')
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Job and CV data could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
  }

  const editJob = (job) => {
    setEditingJob(job)
    setValues({ title: job.title || '', company: job.company || '', location: job.location || '', url: job.url || '', description: job.description || '' })
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingJob(null)
    setValues(emptyForm)
    setErrors({})
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateJobForm(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    if (!selectedResume) {
      setErrors({ form: 'Choose a CV to compare with this role.' })
      return
    }
    setSubmitting(true)
    try {
      const savedJob = normalizeJob(editingJob ? await jobApi.update(editingJob.id, values) : await jobApi.create(values))
      if (!savedJob?.id) throw new Error('The API did not return an identifiable job. Try again.')
      setJobs((current) => (editingJob ? current.map((job) => (job.id === savedJob.id ? savedJob : job)) : [savedJob, ...current]))
      const result = await matchApi.create(savedJob.id, selectedResume, {})
      const matchId = result?.match?._id || result?.match?.id
      toast.success(result?.cached ? 'Saved match reused from cache.' : 'Compatibility match created.')
      resetForm()
      if (matchId) navigate(`/matches/${encodeURIComponent(matchId)}`)
      else navigate('/matches')
    } catch (submitError) {
      setErrors((current) => ({ ...current, form: getErrorMessage(submitError, 'The match could not be created.') }))
    } finally {
      setSubmitting(false)
    }
  }

  const analyzeJob = async (job, force) => {
    if (!job.id) return
    setAnalyzingId(job.id)
    try {
      const response = await jobApi.analyze(job.id, { force })
      const updated = normalizeJob(response?.job)
      if (updated) setJobs((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      toast.success(response?.cached ? 'Role keywords are already up to date.' : 'Role keywords refreshed.')
    } catch (analyzeError) {
      toast.error(getErrorMessage(analyzeError, 'The role could not be analyzed.'))
    } finally {
      setAnalyzingId('')
    }
  }

  const deleteJob = async (job) => {
    try {
      await jobApi.remove(job.id)
      setJobs((current) => current.filter((item) => item.id !== job.id))
      toast.success('Role removed.')
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'The role could not be removed.'))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Job matcher"
        title="Find the fit, with reasons."
        description="Paste a role description, choose a CV, and get an explainable compatibility read."
        action={<Button variant="outline" asChild><Link to="/matches">Saved results</Link></Button>}
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Workspace data is unavailable</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={load}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">New compatibility check</p>
              <h2 className="mt-2 font-display text-xl font-semibold">Describe the role</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">The matcher will compare the evidence in your CV with this description.</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
          </div>

          <div className="mb-6">
            <label htmlFor="match-resume" className="text-sm font-medium text-foreground">CV to match</label>
            <Select value={selectedResume} onValueChange={setSelectedResume}>
              <SelectTrigger id="match-resume" className="mt-2">
                <SelectValue placeholder={resumes.length ? 'Choose a CV version' : 'Upload a CV first'} />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>{resume.name || resume.originalName || 'Untitled CV'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!resumes.length && (
              <p className="mt-2 text-xs text-warning-foreground">
                You need at least one CV before running a match.{' '}
                <Link to="/upload" className="font-semibold text-primary hover:underline">Upload one</Link>.
              </p>
            )}
          </div>

          <JobForm key={editingJob?.id || 'new'} values={values} errors={errors} onChange={updateValue} onSubmit={submit} submitting={submitting} editing={Boolean(editingJob)} />
          {editingJob && <Button variant="ghost" size="sm" className="mt-3" onClick={resetForm}>Cancel editing this role</Button>}
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Saved roles</p>
              <h2 className="mt-2 font-display text-xl font-semibold">Your job library</h2>
            </div>
            <Badge variant="outline">{jobs.length} {jobs.length === 1 ? 'role' : 'roles'}</Badge>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div>
          ) : jobs.length ? (
            <div className="mt-6 space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-border p-4 transition hover:border-primary/25">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BriefcaseBusiness className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{job.title || 'Untitled role'}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {job.company || 'Company not specified'}{job.location ? ` \u00b7 ${job.location}` : ''}
                      </p>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description || 'No description saved.'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${job.title || 'role'}`}><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => analyzeJob(job, false)} disabled={analyzingId === job.id}>
                          <WandSparkles className="mr-2 h-4 w-4" />
                          {analyzingId === job.id ? 'Analyzing…' : 'Analyze role keywords'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => analyzeJob(job, true)} disabled={analyzingId === job.id}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Re-analyze keywords
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editJob(job)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit and rematch
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteJob(job)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact className="mt-6" icon={BriefcaseBusiness} title="No saved roles" description="Add a role description to start a compatibility check." />
          )}
        </Card>
      </div>
    </div>
  )
}
