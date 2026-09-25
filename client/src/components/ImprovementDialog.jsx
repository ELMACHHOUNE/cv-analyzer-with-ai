import { useState } from 'react'
import { ClipboardPenLine, History, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { analysisApi } from '@/services/api'
import { getErrorDetailText, getErrorMessage, safeArray } from '@/lib/utils'
import { asText, isPlainRecord } from '@/lib/normalize'

function unwrapImprovement(payload) {
  if (!isPlainRecord(payload)) return { revisions: [], suggestions: [], guardrail: '' }
  return {
    revisions: safeArray(payload.revisions || payload.improvement?.revisions),
    suggestions: safeArray(payload.suggestions || payload.improvement?.suggestions || payload.improvements || payload.recommendations),
    guardrail: asText(payload.guardrail || payload.improvement?.guardrail),
  }
}

function suggestionText(item) {
  if (typeof item === 'string') return { title: '', body: item.trim() }
  if (!isPlainRecord(item)) return { title: '', body: '' }
  const body = asText(item.suggestion || item.text || item.content || item.description || item.original) || asText(item.replacement)
  const title = asText(item.section || item.title || item.field || item.name)
  return { title, body }
}

function revisionText(item) {
  if (typeof item === 'string') return { label: 'Revision', before: '', after: item.trim() }
  if (!isPlainRecord(item)) return { label: 'Revision', before: '', after: '' }
  return {
    label: asText(item.section || item.title || item.field || item.label) || 'Revision',
    before: asText(item.original || item.before || item.previous),
    after: asText(item.revised || item.after || item.suggestion || item.replacement || item.updated),
  }
}

export function ImprovementDialog({ analysisId }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const requestSuggestions = async () => {
    if (!analysisId || loading) return
    setLoading(true)
    setError('')
    try {
      setResult(await analysisApi.improve(analysisId))
    } catch (requestError) {
      setError([getErrorMessage(requestError, 'Suggestions are not available right now.'), getErrorDetailText(requestError)].filter(Boolean).join(' '))
    } finally {
      setLoading(false)
    }
  }

  const { revisions, suggestions, guardrail } = unwrapImprovement(result)
  const renderedSuggestions = suggestions.map(suggestionText).filter((item) => item.body)
  const renderedRevisions = revisions.map(revisionText).filter((item) => item.after || item.before)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><ClipboardPenLine className="h-4 w-4" /> Improve my CV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review CV improvements</DialogTitle>
          <DialogDescription>These are suggestions for your review. CVision does not overwrite or replace your source CV.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Could not generate suggestions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center gap-3 border border-hairline bg-surface-soft p-5 text-[14px] font-light text-muted" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Preparing review suggestions…
          </div>
        ) : renderedSuggestions.length || renderedRevisions.length ? (
          <div className="scrollbar-thin max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {renderedSuggestions.length > 0 && (
              <div className="space-y-3">
                {renderedSuggestions.map((item, index) => (
                  <div key={`${item.body}-${index}`} className="border border-hairline bg-surface-soft p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.14em]">{item.title || 'Suggested edit'}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.55] font-light text-body">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
            {renderedRevisions.length > 0 && (
              <div className="space-y-3">
                <p className="label-uppercase flex items-center gap-2 text-muted"><History className="h-3.5 w-3.5" aria-hidden="true" /> Proposed revisions</p>
                {renderedRevisions.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="border border-hairline p-4">
                    <Badge variant="outline">{item.label}</Badge>
                    {item.before && <p className="mt-3 text-[14px] leading-[1.55] font-light text-muted line-through decoration-error/40">{item.before}</p>}
                    {item.after && <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.55] font-light text-body">{item.after}</p>}
                  </div>
                ))}
              </div>
            )}
            {guardrail && (
              <div className="flex gap-3 border border-success/30 bg-success/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p className="text-[14px] leading-[1.55] font-light text-body">{guardrail}</p>
              </div>
            )}
          </div>
        ) : result ? (
          <div className="border border-dashed border-hairline-strong p-7 text-center text-[14px] font-light text-muted">The API returned no suggestions or revisions for this analysis.</div>
        ) : (
          <div className="border border-dashed border-hairline-strong p-7 text-center">
            <ClipboardPenLine className="mx-auto h-7 w-7 text-muted-soft" aria-hidden="true" />
            <p className="mt-3 text-[15px] font-bold">Ready when you are</p>
            <p className="mt-2 text-[14px] font-light text-muted">Generate a review list without changing your source document.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={requestSuggestions} disabled={loading}>{loading ? 'Working…' : result ? 'Regenerate' : 'Generate suggestions'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
