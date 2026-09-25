import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell, AuthSpinner } from '@/components/AuthShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/lib/utils'
import { hasErrors, validateLoginForm } from '@/lib/validators'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSubmitting(true)
    setFormError('')
    try {
      await login(values)
      toast.success('Welcome back.')
      const next = searchParams.get('next')
      navigate(next?.startsWith('/') ? next : '/dashboard', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'We could not sign you in.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthShell title="Welcome back" description="Sign in to pick up where your career story left off." footer={<p className="text-center text-sm text-muted-foreground">New to CVision? <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link></p>}><form onSubmit={submit} className="space-y-5" noValidate><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" /><Label htmlFor="email" className="sr-only">Email address</Label><Input id="email" name="email" type="email" value={values.email} onChange={updateValue} placeholder="you@example.com" autoComplete="email" className="pl-10" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <p id="email-error" className="mt-1.5 text-xs text-destructive">{errors.email}</p>}</div><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" /><Label htmlFor="password" className="sr-only">Password</Label><Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={updateValue} placeholder="Your password" autoComplete="current-password" className="px-10" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>{errors.password && <p id="password-error" className="mt-1.5 text-xs text-destructive">{errors.password}</p>}</div>{formError && <Alert variant="destructive"><AlertTitle>Sign in failed</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}<Button type="submit" className="w-full" disabled={submitting}>{submitting ? <><AuthSpinner /> Signing in…</> : 'Sign in to workspace'}</Button></form></AuthShell>
}
