import { ArrowLeft, LoaderCircle, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { DarkGrid } from '@/components/ui/section'
import { useTheme } from '@/context/ThemeContext'

const proofPoints = [
  { value: 'Explainable', label: 'See the signal behind every score' },
  { value: 'Private', label: 'Your documents stay in your workspace' },
]

/* Split shell: a navy hero band on the left, the form on canvas. */
export function AuthShell({ children, title, description, footer, aside }) {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <main className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)]">
      <section className="relative hidden flex-col overflow-hidden bg-surface-dark px-10 py-10 text-on-dark lg:flex xl:px-16">
        <DarkGrid />
        <Logo onDark className="relative" />
        <div className="relative my-auto max-w-lg py-16">
          <p className="label-uppercase text-on-dark-soft">Career intelligence, without the guesswork</p>
          <h1 className="mt-6 text-[56px] leading-[1.05] font-bold text-balance xl:text-[64px]">Your CV is more than a document.</h1>
          <p className="mt-6 max-w-md text-[18px] leading-[1.55] font-light text-on-dark-soft">Turn scattered experience into a confident story, then see where it could take you next.</p>
          <dl className="mt-12 grid max-w-sm grid-cols-2 gap-8 border-t border-on-dark/15 pt-8">
            {proofPoints.map((point) => (
              <div key={point.value}>
                <dt className="text-[20px] leading-[1.3] font-bold text-on-dark">{point.value}</dt>
                <dd className="mt-2 text-[13px] leading-[1.4] font-light text-on-dark-soft">{point.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-[12px] font-light text-on-dark-soft">CVision AI — career intelligence workspace</p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </Button>
            <Button variant="ghost" size="sm" asChild className="lg:hidden">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {title && <h2 className="text-[32px] leading-[1.15] font-bold">{title}</h2>}
          {description && <p className="mt-3 text-[16px] leading-[1.55] font-light text-muted">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>

        {footer && <div className="mx-auto w-full max-w-md">{footer}</div>}
        {aside}
      </section>
    </main>
  )
}

/* cookie-consent-card — hairline plate used for the fine-print block. */
export function AuthAside() {
  return (
    <div className="mx-auto mt-8 w-full max-w-md border border-hairline p-6">
      <p className="label-uppercase text-primary">Built for better conversations</p>
      <p className="mt-3 text-[14px] leading-[1.55] font-light text-muted">Upload a CV, understand the gaps, and walk into your next application with a point of view.</p>
    </div>
  )
}

export function AuthSpinner() {
  return <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
}
