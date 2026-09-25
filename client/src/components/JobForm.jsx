import { useState } from 'react'
import { BriefcaseBusiness, LoaderCircle, Save } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function JobForm({ values, errors = {}, onChange, onSubmit, submitting, editing = false }) {
  const [touchedDescription, setTouchedDescription] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="job-title">Job title</Label>
          <Input id="job-title" name="title" value={values.title || ''} onChange={onChange} placeholder="Senior frontend engineer" className="mt-2" aria-invalid={Boolean(errors.title)} />
          {errors.title && <p className="mt-2 text-[13px] font-light text-error">{errors.title}</p>}
        </div>
        <div>
          <Label htmlFor="job-company">Company</Label>
          <Input id="job-company" name="company" value={values.company || ''} onChange={onChange} placeholder="Company or team" className="mt-2" aria-invalid={Boolean(errors.company)} />
          {errors.company && <p className="mt-2 text-[13px] font-light text-error">{errors.company}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="job-location">
            Location <span className="font-normal text-muted">(optional)</span>
          </Label>
          <Input id="job-location" name="location" value={values.location || ''} onChange={onChange} placeholder="Remote or Berlin" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="job-url">
            Job URL <span className="font-normal text-muted">(optional)</span>
          </Label>
          <Input id="job-url" name="url" type="url" value={values.url || ''} onChange={onChange} placeholder="https://…" className="mt-2" aria-invalid={Boolean(errors.url)} />
          {errors.url && <p className="mt-2 text-[13px] font-light text-error">{errors.url}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="job-description">Job description</Label>
          <span className="text-[12px] tracking-[0.5px] text-muted">{values.description?.length || 0} characters</span>
        </div>
        <Textarea
          id="job-description"
          name="description"
          value={values.description || ''}
          onChange={(event) => {
            onChange(event)
            setTouchedDescription(true)
          }}
          onBlur={() => setTouchedDescription(true)}
          placeholder="Paste the role requirements, responsibilities, and qualifications here…"
          className="mt-2 min-h-48"
          aria-invalid={Boolean(errors.description)}
          aria-describedby="job-description-help"
        />
        <p id="job-description-help" className="mt-2 text-[13px] font-light text-muted">More context gives the matcher better evidence to work with.</p>
        {errors.description && (touchedDescription || errors.description) && <p className="mt-2 text-[13px] font-light text-error">{errors.description}</p>}
      </div>

      <div className="flex gap-3 border border-hairline bg-surface-soft p-4">
        <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-[13px] leading-[1.55] font-light text-muted">Use a role description you have permission to process. CVision does not scrape job boards.</p>
      </div>

      {errors.form && (
        <Alert variant="destructive">
          <AlertTitle>Could not run this match</AlertTitle>
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> {editing ? 'Updating and matching…' : 'Matching CV to role…'}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden="true" /> {editing ? 'Update role and match' : 'Run compatibility match'}
          </>
        )}
      </Button>
    </form>
  )
}
