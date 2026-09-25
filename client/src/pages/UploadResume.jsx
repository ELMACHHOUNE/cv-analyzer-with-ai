import { useEffect, useState } from 'react'
import { Check, FileText, History, LoaderCircle, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { ResumeUploader } from '@/components/ResumeUploader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { analysisApi, resumeApi } from '@/services/api'
import { formatDate, formatFileSize, getErrorMessage } from '@/lib/utils'
import { normalizeList, normalizeResume } from '@/lib/normalize'
import { MAX_RESUME_NAME_LENGTH } from '@/lib/validators'

const statusLabels = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  processed: 'Processed',
  failed: 'Failed',
}

export function UploadResume() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [versionName, setVersionName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [pendingResumeId, setPendingResumeId] = useState('')

  const loadResumes = async () => {
    setLoading(true)
    setError('')
    try {
      setResumes(normalizeList(await resumeApi.list({ limit: 100 }), 'resumes').map(normalizeResume).filter(Boolean))
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Your CVs could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  const handleComplete = async (resume) => {
    const normalized = normalizeResume(resume)
    const resumeId = normalized?.id
    setVersionName('')
    await loadResumes()
    if (!resumeId) {
      toast.error('The CV was uploaded, but the API did not return an id for it.')
      navigate('/analysis')
      return
    }
    /* Analysis is a synchronous API call, not a background job — run it now
       so the user lands on a real review instead of an empty workspace. */
    setPendingResumeId(resumeId)
    setAnalyzing(true)
    try {
      const created = await analysisApi.create(resumeId)
      const createdId = created?._id || created?.id
      if (createdId) {
        toast.success('Analysis is ready.')
        navigate(`/analysis/${encodeURIComponent(createdId)}`, { replace: true })
        return
      }
      navigate(`/analysis?resumeId=${encodeURIComponent(resumeId)}`, { replace: true })
    } catch (analysisError) {
      const message = getErrorMessage(analysisError, 'The CV is saved, but the analysis could not be started.')
      toast.error(message)
      navigate(`/analysis?resumeId=${encodeURIComponent(resumeId)}`, {
        replace: true,
        state: { runFailure: { message, code: analysisError?.code || '' } }
      })
    }
  }

  const deleteResume = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await resumeApi.remove(deleteTarget.id)
      setResumes((current) => current.filter((resume) => resume.id !== deleteTarget.id))
      toast.success('CV removed from your workspace.')
      setDeleteTarget(null)
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, 'The CV could not be removed.'))
    } finally {
      setDeleting(false)
    }
  }

  const reAnalyze = async (resume) => {
    if (!resume.id) return
    try {
      const created = await analysisApi.create(resume.id)
      const analysisId = created?._id || created?.id
      toast.success(analysisId ? 'Analysis is ready.' : 'Analysis request started.')
      if (analysisId) navigate(`/analysis/${analysisId}`)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Analysis request failed.'))
    }
  }

  const saveRename = async () => {
    if (!renaming?.id) return
    try {
      const updated = normalizeResume(await resumeApi.update(renaming.id, { name: renaming.name.trim() }))
      if (updated) setResumes((current) => current.map((resume) => (resume.id === updated.id ? updated : resume)))
      toast.success('CV renamed.')
      setRenaming(null)
    } catch (renameError) {
      toast.error(getErrorMessage(renameError, 'The CV could not be renamed.'))
    }
  }

  return (
    <div>
      <PageHeader eyebrow="My CVs" title="Build a better version of you." description="Keep multiple versions organized, then choose the one you want to understand next." action={<Button variant="outline" asChild><Link to="/history"><History className="h-4 w-4" /> View history</Link></Button>} />
      <div className="grid gap-7 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5 sm:p-7">
          <div className="mb-6">
            <p className="label-uppercase text-primary">Add a version</p>
            <h2 className="mt-3 text-[20px] leading-[1.3] font-bold">Upload a CV</h2>
            <p className="mt-2 text-[14px] leading-[1.55] font-light text-muted">Give this version a name so it is easy to compare later.</p>
            <div className="mt-6">
              <Label htmlFor="version-name">Version name <span className="font-normal text-muted">(optional)</span></Label>
              <Input id="version-name" value={versionName} onChange={(event) => setVersionName(event.target.value)} placeholder="e.g. Product-focused CV" className="mt-2" maxLength={MAX_RESUME_NAME_LENGTH} aria-describedby="version-name-hint" />
              <p id="version-name-hint" className="mt-2 text-[13px] font-light text-muted">Up to {MAX_RESUME_NAME_LENGTH} characters. Leave it empty to use the file name.</p>
            </div>
          </div>
            {analyzing ? (
              <div className="border border-hairline bg-surface-soft p-6" aria-live="polite">
                <p className="label-uppercase text-primary">Analyzing your CV</p>
                <p className="mt-4 flex items-center gap-3 text-[18px] leading-[1.3] font-bold">
                  <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  Reading the document
                </p>
                <p className="mt-3 text-[14px] leading-[1.55] font-light text-muted">
                  The API returns the structured review for this version. It runs
                  once, on demand, and can take up to a minute — this page will
                  open the result as soon as it arrives.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => navigate(`/analysis?resumeId=${encodeURIComponent(pendingResumeId)}`)}
                >
                  Open the workspace instead
                </Button>
              </div>
            ) : (
              <ResumeUploader versionName={versionName} onComplete={handleComplete} onReset={() => setVersionName('')} />
            )}
        </Card>
        <div>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="label-uppercase text-primary">Saved versions</p>
              <h2 className="mt-3 text-[20px] leading-[1.3] font-bold">Your CV library</h2>
            </div>
            <Badge variant="outline">{resumes.length} {resumes.length === 1 ? 'file' : 'files'}</Badge>
          </div>
          {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Could not load your CVs</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? (
            <div className="space-y-px bg-hairline">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
          ) : resumes.length ? (
            <div className="space-y-px bg-hairline">
              {resumes.map((resume) => {
                const analysisId = resume.analysis?.id
                const analysisLink = analysisId ? `/analysis/${encodeURIComponent(analysisId)}` : resume.id ? `/analysis?resumeId=${encodeURIComponent(resume.id)}` : '/analysis'
                return (
                  <Card key={resume.id} className="p-4 transition-colors hover:border-hairline-strong">
                    <div className="flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center border border-hairline bg-surface-soft text-primary"><FileText className="h-4 w-4" aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-ink">{resume.name || resume.originalName || 'Untitled CV'}</p>
                        <p className="mt-1 text-[13px] font-light text-muted">{formatFileSize(resume.fileSize)} · {statusLabels[resume.status] || resume.status} · {formatDate(resume.createdAt)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={resume.status === 'processed' ? 'success' : resume.status === 'failed' ? 'danger' : 'outline'}>{statusLabels[resume.status] || resume.status}</Badge>
                          {resume.analysis && <Badge variant="info">Analysis ready</Badge>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${resume.name || 'CV'}`}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={analysisLink}><Check className="mr-2 h-4 w-4" /> Open analysis</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRenaming({ id: resume.id, name: resume.name || '' })}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(resume)} className="text-error focus:text-error"><Trash2 className="mr-2 h-4 w-4" /> Delete CV</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-hairline pt-3">
                      <Button size="sm" variant="outline" className="flex-1" asChild><Link to={analysisLink}>{analysisId ? 'View analysis' : 'Analyze CV'}</Link></Button>
                      <Button size="sm" variant="ghost" onClick={() => reAnalyze(resume)} disabled={!resume.id}><Plus className="mr-1.5 h-3.5 w-3.5" /> Re-analyze</Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={FileText} title="Your library is empty" description="Upload your first CV to start building a clearer career story." action={<Button size="sm" onClick={() => document.querySelector('input[type=file]')?.click()}>Choose a file</Button>} />
          )}
        </div>
      </div>
      <Dialog open={Boolean(renaming)} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this CV</DialogTitle>
            <DialogDescription>The name is used to identify this version in your history and comparisons.</DialogDescription>
          </DialogHeader>
          <Input value={renaming?.name || ''} onChange={(event) => setRenaming((current) => ({ ...current, name: event.target.value }))} maxLength={MAX_RESUME_NAME_LENGTH} aria-label="New CV name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={saveRename}>Save name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this CV?</DialogTitle>
            <DialogDescription>This removes the saved file reference from your workspace. Existing match history may no longer be able to reference it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Keep CV</Button>
            <Button variant="destructive" onClick={deleteResume} disabled={deleting}>{deleting ? 'Removing…' : 'Remove CV'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
