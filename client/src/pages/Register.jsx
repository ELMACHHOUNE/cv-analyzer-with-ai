import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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

  return (
    <AuthShell
      title="Create your workspace"
      description="Start with a clearer view of the experience you have."
      footer={(
        <p className="text-center text-[14px] font-light text-muted">
          Already have an account? <Link to="/login" className="font-bold text-primary">Sign in</Link>
        </p>
      )}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={updateValue}
            placeholder="Your name"
            autoComplete="name"
            className="mt-2"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="mt-2 text-[13px] font-light text-error">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue}
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-2"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="mt-2 text-[13px] font-light text-error">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={updateValue}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="pr-14"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-muted transition-colors hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password && <p id="password-error" className="mt-2 text-[13px] font-light text-error">{errors.password}</p>}
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <AuthSpinner /> Creating your workspace…
            </>
          ) : (
            'Create workspace'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
