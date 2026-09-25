import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell, AuthSpinner } from '@/components/AuthShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/lib/utils'
import { hasErrors, validateRegisterForm } from '@/lib/validators'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '' })
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
    const nextErrors = validateRegisterForm(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    setSubmitting(true)
    setFormError('')
    try {
      await register(values)
      toast.success('Your workspace is ready.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, 'We could not create your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthShell title="Create your workspace" description="Start with a clearer view of the experience you have." footer={<p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>}><form onSubmit={submit} className="space-y-5" noValidate><div className="relative"><UserRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" /><Label htmlFor="name" className="sr-only">Full name</Label><Input id="name" name="name" value={values.name} onChange={updateValue} placeholder="Your name" autoComplete="name" className="pl-10" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />{errors.name && <p id="name-error" className="mt-1.5 text-xs text-destructive">{errors.name}</p>}</div><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" /><Label htmlFor="email" className="sr-only">Email address</Label><Input id="email" name="email" type="email" value={values.email} onChange={updateValue} placeholder="you@example.com" autoComplete="email" className="pl-10" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <p id="email-error" className="mt-1.5 text-xs text-destructive">{errors.email}</p>}</div><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" /><Label htmlFor="password" className="sr-only">Password</Label><Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={updateValue} placeholder="At least 8 characters" autoComplete="new-password" className="px-10" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition hover:text-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>{errors.password && <p id="password-error" className="mt-1.5 text-xs text-destructive">{errors.password}</p>}</div>{formError && <Alert variant="destructive"><AlertTitle>Account creation failed</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}<Button type="submit" className="w-full" disabled={submitting}>{submitting ? <><AuthSpinner /> Creating workspace…</> : 'Create workspace'}</Button><p className="text-center text-[11px] leading-5 text-muted-foreground">Your account stores only what is needed to manage your private CV workspace. Never share passwords or API keys in a CV.</p></form></AuthShell>
}
