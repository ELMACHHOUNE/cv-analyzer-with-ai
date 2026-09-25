import { useCallback, useEffect, useState } from 'react'
import { FileArchive, FileImage, FileText, LoaderCircle, RotateCcw, UploadCloud, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { resumeApi } from '@/services/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn, formatFileSize, getErrorDetailText, getErrorMessage } from '@/lib/utils'
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, truncateResumeName, validateFile } from '@/lib/validators'

const acceptMap = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

function FileIcon({ type }) {
  if (type === 'image/png' || type === 'image/jpeg') return <FileImage className="h-6 w-6" />
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileArchive className="h-6 w-6" />
  return <FileText className="h-6 w-6" />
}

export function ResumeUploader({ onComplete, onReset: onParentReset, versionName = '', className }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('idle')

  useEffect(() => {
    if (!file || (!file.type.startsWith('image/'))) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const selectFile = useCallback((acceptedFile) => {
    const validationError = validateFile(acceptedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setError('')
    setFile(acceptedFile)
    setProgress(0)
    setStage('idle')
  }, [])

  const onDrop = useCallback((acceptedFiles) => {
    selectFile(acceptedFiles?.[0])
  }, [selectFile])

  const onDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections?.[0]
    const code = rejection?.errors?.[0]?.code
    setError(code === 'file-too-large' ? 'The file must be smaller than 10 MB.' : 'That file type is not supported. Use PDF, DOCX, JPG, JPEG, or PNG.')
    setFile(null)
  }, [])

  const { getRootProps, getInputProps, inputRef, isDragActive, open } = useDropzone({
    accept: acceptMap,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop,
    onDropRejected,
  })

  const reset = () => {
    setFile(null)
    setError('')
    setUploading(false)
    setProgress(0)
    setStage('idle')
    if (inputRef.current) inputRef.current.value = ''
    onParentReset?.()
  }

  const upload = async () => {
    if (!file || uploading) return
    setError('')
    setUploading(true)
    setStage('uploading')
    setProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', truncateResumeName(versionName, file.name))
    try {
      const resume = await resumeApi.upload(formData, (event) => {
        const nextProgress = event.total ? Math.round((event.loaded / event.total) * 100) : 0
        setProgress(nextProgress)
        if (nextProgress >= 100) setStage('queued')
      })
      const status = resume?.status
      setProgress(100)
      setStage(status === 'failed' ? 'error' : 'complete')
      if (status === 'failed') {
        setError(resume?.message || 'The server could not process this CV.')
        return
      }
      await onComplete?.(resume, file)
    } catch (uploadError) {
      setStage('error')
      setError([getErrorMessage(uploadError, 'The CV could not be uploaded. Please try again.'), getErrorDetailText(uploadError)].filter(Boolean).join(' '))
    } finally {
      setUploading(false)
    }
  }

  const stageCopy = {
    uploading: { title: 'Uploading your CV', detail: 'The file is on its way to your private workspace.' },
    queued: { title: 'Upload complete · processing queued', detail: 'The API is still processing this document. We will only show an analysis when the server returns one.' },
    complete: { title: 'Upload received', detail: 'Opening the analysis workspace now.' },
    error: { title: 'Upload needs attention', detail: 'Review the message below and try again.' },
  }
  const currentStage = stageCopy[stage]
  const isImage = file?.type?.startsWith('image/')

  return <div className={cn('space-y-4', className)}><div {...getRootProps()} className={cn('relative rounded-2xl border border-dashed p-6 text-center outline-none transition sm:p-10', isDragActive ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-border bg-muted/25 hover:border-primary/45 hover:bg-muted/40')}><input {...getInputProps()} ref={inputRef} /><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud className="h-6 w-6" /></div><p className="mt-5 font-display text-lg font-semibold text-foreground">{isDragActive ? 'Drop your CV here' : 'Drag and drop your CV'}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Upload one version at a time. We support PDF, DOCX, JPG, JPEG, and PNG files up to 10 MB.</p><Button type="button" variant="outline" size="sm" className="mt-5" onClick={open}><UploadCloud className="h-4 w-4" /> Browse files</Button><p className="mt-4 text-[11px] text-muted-foreground">Your file is sent to your configured API only after you choose it.</p></div>{error && <Alert variant="destructive"><X className="h-4 w-4" /><AlertTitle>We couldn’t use that file</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}{file && <div className="rounded-2xl border border-border bg-card p-4 shadow-card"><div className="flex items-center gap-3"><div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">{isImage && previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : <FileIcon type={file.type} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatFileSize(file.size)} · {file.type || (SUPPORTED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase()) ? 'Ready to upload' : 'Document')}</p></div>{!uploading && <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Remove selected file"><X className="h-4 w-4" /></Button>}</div>{uploading && <div className="mt-5 space-y-3"><div className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-2 font-medium text-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" />{currentStage?.title || 'Uploading'}</span><span className="font-semibold text-primary">{progress}%</span></div><Progress value={progress} /><p className="text-xs leading-5 text-muted-foreground" aria-live="polite">{currentStage?.detail}</p></div>}{stage === 'complete' && <div className="mt-4 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs text-success-foreground"><span className="font-semibold">Upload received.</span> The server response is being used for the next step.</div>}{!uploading && stage !== 'complete' && <Button type="button" className="mt-5 w-full" onClick={upload}><UploadCloud className="h-4 w-4" /> Upload and continue</Button>}{stage === 'error' && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Start over</Button>}</div>}</div>
}
