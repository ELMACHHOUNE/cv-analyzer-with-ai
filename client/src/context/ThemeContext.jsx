import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { THEME_VALUES } from '@/lib/normalize'

const ThemeContext = createContext(null)
const THEME_KEY = 'cvision_theme'

function normalizeTheme(value) {
  return THEME_VALUES.includes(value) ? value : ''
}

function prefersDark() {
  if (typeof window === 'undefined') return false
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'system'
  return normalizeTheme(window.localStorage.getItem(THEME_KEY)) || 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [systemDark, setSystemDark] = useState(prefersDark)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemDark))
  }, [theme, systemDark])

  const setTheme = useCallback((value) => {
    const nextTheme = normalizeTheme(value) || 'system'
    setThemeState(nextTheme)
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, nextTheme)
  }, [])

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    isSystem: theme === 'system',
    setTheme,
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
