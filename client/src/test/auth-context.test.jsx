import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/context/AuthContext'

const { tokenState, authApi, apiMocks } = vi.hoisted(() => {
  const tokenState = { value: '' }
  const authApi = {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  }
  const apiMocks = {
    getStoredToken: vi.fn(() => tokenState.value),
    setStoredToken: vi.fn((token) => { tokenState.value = token }),
  }
  return { tokenState, authApi, apiMocks }
})

vi.mock('@/services/api', () => ({
  ...apiMocks,
  authApi,
  UNAUTHORIZED_EVENT: 'cvision:unauthorized',
}))

function Probe() {
  const { user, isAuthenticated, loading, login } = useAuth()
  return <div><span data-testid="loading">{String(loading)}</span><span data-testid="authenticated">{String(isAuthenticated)}</span><span data-testid="user">{user?.name || 'No user'}</span><button onClick={() => login({ email: 'ada@example.com', password: 'password123' })}>Sign in</button></div>
}

describe('AuthContext', () => {
  beforeEach(() => {
    tokenState.value = ''
    authApi.login.mockReset()
    authApi.login.mockResolvedValue({ token: 'jwt-token', user: { name: 'Ada Lovelace', email: 'ada@example.com' } })
  })

  it('restores a JWT-only session and exposes the authenticated user', async () => {
    tokenState.value = 'existing-token'
    authApi.me.mockResolvedValue({ name: 'Grace Hopper', email: 'grace@example.com' })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(apiMocks.setStoredToken).not.toHaveBeenCalledWith(expect.anything())
  })

  it('persists only the returned JWT and signs in the current user', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    act(() => {
      screen.getByRole('button', { name: 'Sign in' }).click()
    })
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(apiMocks.setStoredToken).toHaveBeenCalledWith('jwt-token')
    expect(apiMocks.setStoredToken).toHaveBeenCalledTimes(1)
  })
})
