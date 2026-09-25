import { useEffect, useState } from 'react'
import { Check, KeyRound, Languages, Monitor, Moon, Palette, ShieldCheck, Sun, Target, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { settingsApi } from '@/services/api'
import { getErrorDetailText, getErrorMessage, getFieldError, getInitials } from '@/lib/utils'
import { isValidEmail } from '@/lib/validators'
import { THEME_VALUES, normalizePasswordResult, normalizeSettings } from '@/lib/normalize'

const emptyProfile = { name: '', email: '', targetRole: '', preferredLanguage: '', theme: 'system' }
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Dutch', 'Arabic']

const themeChoices = [
  { value: 'system', label: 'System', detail: 'Follows your device', icon: Monitor, swatch: 'bg-gradient-to-br from-slate-100 to-slate-800' },
  { value: 'light', label: 'Light', detail: 'Bright and clear', icon: Sun, swatch: 'bg-white' },
  { value: 'dark', label: 'Dark', detail: 'Low-light focused', icon: Moon, swatch: 'bg-slate-900' },
]

function isConflict(error) {
  if (error?.status === 409 || error?.response?.status === 409) return true
  return /already|conflict|taken|in use|exists/i.test(getErrorMessage(error, ''))
}

export function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState({ ...emptyProfile, name: user?.name || '', email: user?.email || '' })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [pageError, setPageError] = useState('')
  const [conflict, setConflict] = useState('')
  const [reauthNotice, setReauthNotice] = useState(false)

  const load = async () => {
    setLoading(true)
    setPageError('')
    try {
      const settings = normalizeSettings(await settingsApi.get())
      setProfile({
        name: settings.name || user?.name || '',
        email: settings.email || user?.email || '',
        targetRole: settings.targetRole,
        preferredLanguage: settings.preferredLanguage,
        theme: settings.theme || 'system',
      })
      if (settings.theme) setTheme(settings.theme)
    } catch (loadError) {
      setPageError([getErrorMessage(loadError, 'Settings could not be loaded.'), getErrorDetailText(loadError)].filter(Boolean).join(' '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '', form: '' }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!profile.name?.trim()) nextErrors.name = 'Name is required.'
    if (!profile.email?.trim()) nextErrors.email = 'Email is required.'
    else if (!isValidEmail(profile.email)) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSavingProfile(true)
    setConflict('')
    try {
      const settings = normalizeSettings(await settingsApi.update({
        name: profile.name.trim(),
        email: profile.email.trim(),
        targetRole: profile.targetRole.trim(),
        preferredLanguage: profile.preferredLanguage,
      }))
      if (settings.name) updateProfileField('name', settings.name)
      if (settings.email) updateProfileField('email', settings.email)
      toast.success('Profile settings saved.')
    } catch (saveError) {
      const fieldErrors = {
        name: getFieldError(saveError, 'name'),
        email: getFieldError(saveError, 'email'),
        targetRole: getFieldError(saveError, 'targetRole'),
      }
      setErrors((current) => ({ ...current, ...Object.fromEntries(Object.entries(fieldErrors).filter(([, value]) => value)) }))
      if (isConflict(saveError)) setConflict(getErrorDetailText(saveError, getErrorMessage(saveError, 'That change conflicts with an existing record.')))
      else toast.error(getErrorDetailText(saveError, getErrorMessage(saveError, 'Profile settings could not be saved.')))
    } finally {
      setSavingProfile(false)
    }
  }

  const saveTheme = async () => {
    setSavingTheme(true)
    try {
      const settings = normalizeSettings(await settingsApi.update({ theme: profile.theme }))
      if (settings.theme) updateProfileField('theme', settings.theme)
      toast.success('Appearance saved to your account.')
    } catch (saveError) {
      toast.error(getErrorDetailText(saveError, getErrorMessage(saveError, 'Appearance could not be saved.')))
    } finally {
      setSavingTheme(false)
    }
  }

  const chooseTheme = (value) => {
    const next = THEME_VALUES.includes(value) ? value : 'system'
    updateProfileField('theme', next)
    setTheme(next)
  }

  const savePassword = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!password.currentPassword) nextErrors.currentPassword = 'Current password is required.'
    if (!password.newPassword) nextErrors.newPassword = 'New password is required.'
    else if (password.newPassword.length < 8) nextErrors.newPassword = 'Use at least 8 characters.'
    if (password.newPassword !== password.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSavingPassword(true)
    try {
      const result = normalizePasswordResult(await settingsApi.changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }))
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      if (result.reauthenticationRequired) setReauthNotice(true)
      toast.success('Password updated.')
    } catch (saveError) {
      const currentPasswordError = getFieldError(saveError, 'currentPassword')
      if (currentPasswordError) setErrors((current) => ({ ...current, currentPassword: currentPasswordError }))
      toast.error(getErrorDetailText(saveError, getErrorMessage(saveError, 'Password could not be updated.')))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div aria-busy={loading}>
      <PageHeader eyebrow="Settings" title="Make the workspace yours." description="Your profile, target role, and reading preferences are stored on your account. Secrets and API credentials never belong in this form." />
      {pageError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}
      {conflict && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>That change conflicts with an existing record</AlertTitle>
          <AlertDescription>{conflict} Pick a different value and save again.</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-base text-primary">{getInitials(profile.name || user?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Profile</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Your public workspace identity</h2>
              </div>
            </div>
            <Separator className="my-7" />
            <form onSubmit={saveProfile} className="space-y-5" noValidate>
              <div>
                <Label htmlFor="settings-name">Name</Label>
                <Input id="settings-name" value={profile.name} onChange={(event) => updateProfileField('name', event.target.value)} className="mt-2" autoComplete="name" aria-invalid={Boolean(errors.name)} />
                {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" type="email" value={profile.email} onChange={(event) => updateProfileField('email', event.target.value)} className="mt-2" autoComplete="email" aria-invalid={Boolean(errors.email)} />
                {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="settings-role">Target role <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="relative mt-2">
                  <Target className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="settings-role" value={profile.targetRole} onChange={(event) => updateProfileField('targetRole', event.target.value)} placeholder="Senior frontend engineer" className="pl-10" aria-invalid={Boolean(errors.targetRole)} />
                </div>
                {errors.targetRole && <p className="mt-1.5 text-xs text-destructive">{errors.targetRole}</p>}
              </div>
              <div>
                <Label htmlFor="settings-language">Preferred language <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="relative mt-2">
                  <Languages className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="settings-language" list="settings-language-options" value={profile.preferredLanguage} onChange={(event) => updateProfileField('preferredLanguage', event.target.value)} placeholder="English" className="pl-10" />
                  <datalist id="settings-language-options">
                    {languageOptions.map((option) => <option key={option} value={option} />)}
                  </datalist>
                </div>
              </div>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</Button>
            </form>
          </Card>
          <Card className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"><KeyRound className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">Security</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Change password</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Use a unique password you do not reuse elsewhere. This form only sends the fields required to change it.</p>
            {reauthNotice && (
              <Alert className="mt-5">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Password changed</AlertTitle>
                <AlertDescription>The server asked for re-authentication, so you may need to sign in again before some actions work.</AlertDescription>
              </Alert>
            )}
            <form onSubmit={savePassword} className="mt-6 space-y-5" noValidate>
              <div>
                <Label htmlFor="current-password">Current password</Label>
                <Input id="current-password" type="password" value={password.currentPassword} onChange={(event) => { setPassword((current) => ({ ...current, currentPassword: event.target.value })); setErrors((current) => ({ ...current, currentPassword: '' })) }} className="mt-2" autoComplete="current-password" aria-invalid={Boolean(errors.currentPassword)} />
                {errors.currentPassword && <p className="mt-1.5 text-xs text-destructive">{errors.currentPassword}</p>}
              </div>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" value={password.newPassword} onChange={(event) => { setPassword((current) => ({ ...current, newPassword: event.target.value })); setErrors((current) => ({ ...current, newPassword: '' })) }} className="mt-2" autoComplete="new-password" aria-invalid={Boolean(errors.newPassword)} />
                {errors.newPassword && <p className="mt-1.5 text-xs text-destructive">{errors.newPassword}</p>}
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input id="confirm-password" type="password" value={password.confirmPassword} onChange={(event) => { setPassword((current) => ({ ...current, confirmPassword: event.target.value })); setErrors((current) => ({ ...current, confirmPassword: '' })) }} className="mt-2" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
              <Button type="submit" variant="outline" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update password'}</Button>
            </form>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Palette className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Appearance</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Choose your light</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Your choice applies immediately and is saved to your account as <code className="rounded bg-muted px-1 py-0.5 text-xs">system</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">light</code>, or <code className="rounded bg-muted px-1 py-0.5 text-xs">dark</code>. Until you save it, the local default applies.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {themeChoices.map((choice) => (
                <button key={choice.value} type="button" onClick={() => chooseTheme(choice.value)} className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition ${profile.theme === choice.value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-border hover:border-primary/40'}`} aria-pressed={profile.theme === choice.value}>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg shadow-sm ${choice.swatch} ${choice.value === 'dark' ? 'text-cyan-200' : 'text-slate-700'}`}><choice.icon className="h-4 w-4" /></span>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>
                      <span className="block text-sm font-semibold">{choice.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{choice.detail}</span>
                    </span>
                    {profile.theme === choice.value && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={saveTheme} disabled={savingTheme}>{savingTheme ? 'Saving…' : 'Save appearance'}</Button>
              {theme !== profile.theme && <Badge variant="outline">Local choice not yet saved</Badge>}
            </div>
          </Card>
          <Card className="border-success/20 bg-success/5 p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <h2 className="font-display text-lg font-semibold">Security boundary</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/75">CVision is designed to keep credentials on the server. This client receives only a JWT in browser storage and never asks for an AI or database secret.</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Account principles</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" /> Uploaded files are selected explicitly.</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" /> Suggestions never overwrite source documents.</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" /> No secret fields are stored in this client.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
