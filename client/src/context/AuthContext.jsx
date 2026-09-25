import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, getStoredToken, setStoredToken, UNAUTHORIZED_EVENT } from '@/services/api'

const AuthContext = createContext(null)

function extractToken(payload) {
  return payload?.token || payload?.jwt || payload?.accessToken || payload?.data?.token || ''
}

function extractUser(payload) {
  return payload?.user || payload?.data?.user || payload?.data || payload || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => getStoredToken())
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()))

  const getCurrentUser = useCallback(async () => {
    if (!getStoredToken()) return null
    try {
      const response = await authApi.me()
      const nextUser = response?.user || response || null
      setUser(nextUser)
      return nextUser
    } catch {
      setStoredToken('')
      setToken('')
      setUser(null)
      return null
    }
  }, [])

  const saveSession = useCallback(async (payload) => {
    const nextToken = extractToken(payload)
    if (nextToken) {
      setStoredToken(nextToken)
      setToken(nextToken)
    }
    const responseUser = extractUser(payload)
    if (responseUser && (responseUser.name || responseUser.email || responseUser._id || responseUser.id)) {
      setUser(responseUser)
      return responseUser
    }
    return getCurrentUser()
  }, [getCurrentUser])

  const register = useCallback(async (values) => saveSession(await authApi.register(values)), [saveSession])
  const login = useCallback(async (values) => saveSession(await authApi.login(values)), [saveSession])

  const logout = useCallback(async () => {
    const activeToken = getStoredToken()
    setStoredToken('')
    setToken('')
    setUser(null)
    setLoading(false)
    if (activeToken) await authApi.logout({ headers: { Authorization: `Bearer ${activeToken}` } }).catch(() => null)
  }, [])

  useEffect(() => {
    let active = true
    const restoreSession = async () => {
      if (!getStoredToken()) {
        if (active) setLoading(false)
        return
      }
      try {
        const response = await authApi.me()
        if (!active) return
        setUser(response?.user || response || null)
      } catch {
        if (!active) return
        setStoredToken('')
        setToken('')
        setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    restoreSession()
    const handleUnauthorized = () => {
      if (active) {
        setToken('')
        setUser(null)
        setLoading(false)
      }
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => {
      active = false
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    register,
    login,
    logout,
    getCurrentUser,
  }), [user, token, loading, register, login, logout, getCurrentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
