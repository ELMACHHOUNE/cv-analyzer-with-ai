import axios from 'axios'
import { asText, isPlainRecord, normalizeAnalysis, normalizeComparisonPayload, normalizeDashboard, normalizeSettings, safeArray, unwrapEntity } from '@/lib/normalize'

const TOKEN_KEY = 'cvision_token'
const UNAUTHORIZED_EVENT = 'cvision:unauthorized'
const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const DEFAULT_TIMEOUT = 30000
const AI_TIMEOUT = 120000
const LIST_PAGE_SIZE = 50

export const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
})

export function getStoredToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_KEY) || ''
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return
  const currentPath = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, '', `/login?next=${encodeURIComponent(currentPath)}`)
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

function normalizeErrorDetails(payload) {
  const source = payload?.details ?? payload?.errors
  if (!source) return null
  if (Array.isArray(source)) return { _form: source.map((entry) => asText(entry)).filter(Boolean) }
  if (isPlainRecord(source)) return source
  return null
}

function createApiError(message, status = 500, details = null) {
  const error = new Error(message || 'The request could not be completed.')
  error.status = status
  error.details = details
  return error
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'success')) {
      if (!payload.success) {
        return Promise.reject(createApiError(payload.message || 'The request failed.', response.status, normalizeErrorDetails(payload)))
      }
      return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload
    }
    return payload
  },
  (error) => {
    const status = error?.response?.status || 0
    if (status === 401) {
      setStoredToken('')
      redirectToLogin()
    }
    const payload = error?.response?.data
    const message = payload?.message || payload?.error || error?.message || (status === 0 ? 'Unable to reach the server. Check your connection and try again.' : 'The request could not be completed.')
    return Promise.reject(createApiError(message, status, normalizeErrorDetails(payload)))
  },
)

export { TOKEN_KEY, UNAUTHORIZED_EVENT, DEFAULT_TIMEOUT, AI_TIMEOUT }

function idPath(prefix, id, suffix = '') {
  return `${prefix}/${encodeURIComponent(id)}${suffix}`
}

function cleanParams(params = {}) {
  const result = {}
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && !value.length) continue
    result[key] = value
  }
  return result
}

function listParams(params = {}) {
  return cleanParams({ page: 1, limit: LIST_PAGE_SIZE, ...(params || {}) })
}

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: (config = {}) => api.post('/auth/logout', undefined, { timeout: AI_TIMEOUT, ...config }),
}

export const resumeApi = {
  upload: (formData, onUploadProgress) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: AI_TIMEOUT,
  }).then((response) => unwrapEntity(response, 'resume')),
  create: (formData, onUploadProgress) => api.post('/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: AI_TIMEOUT,
  }).then((response) => unwrapEntity(response, 'resume')),
  list: (params) => api.get('/resumes', { params: listParams(params) }),
  get: (resumeId) => api.get(idPath('/resumes', resumeId)).then((response) => unwrapEntity(response, 'resume')),
  update: (resumeId, payload) => api.patch(idPath('/resumes', resumeId), cleanParams(payload)).then((response) => unwrapEntity(response, 'resume')),
  remove: (resumeId) => api.delete(idPath('/resumes', resumeId)),
}

export const analysisApi = {
  create: (resumeId, payload = {}) => api.post(idPath('/analysis', resumeId), cleanParams(payload), { timeout: AI_TIMEOUT }).then((response) => unwrapEntity(response, 'analysis')),
  createForResume: (resumeId, payload = {}) => api.post('/analysis', cleanParams({ resumeId, ...(payload || {}) }), { timeout: AI_TIMEOUT }).then((response) => unwrapEntity(response, 'analysis')),
  get: (analysisId) => api.get(idPath('/analysis', analysisId), { timeout: AI_TIMEOUT }).then((response) => unwrapEntity(response, 'analysis')),
  latest: (resumeId) => api.get('/analysis/latest', { params: cleanParams({ resumeId }), timeout: AI_TIMEOUT }).then((response) => unwrapEntity(response, 'analysis')),
  list: (params) => api.get('/analysis', { params: listParams(params) }),
  remove: (analysisId) => api.delete(idPath('/analysis', analysisId)),
  compare: (analysisIds) => api.post('/analysis/compare', { analysisIds: safeArray(analysisIds) }, { timeout: AI_TIMEOUT }).then((response) => normalizeComparisonPayload(response)),
  improve: (analysisId, payload = {}) => api.post(idPath('/analysis', analysisId, '/improve'), cleanParams(payload), { timeout: AI_TIMEOUT }),
  recommendations: (analysisId) => api.get(idPath('/analysis', analysisId), { timeout: AI_TIMEOUT }).then((response) => normalizeAnalysis(response)?.recommendations || []),
}

export const jobApi = {
  list: (params) => api.get('/jobs', { params: listParams(params) }),
  get: (jobId) => api.get(idPath('/jobs', jobId)).then((response) => unwrapEntity(response, 'job')),
  create: (payload) => api.post('/jobs', cleanParams(payload)).then((response) => unwrapEntity(response, 'job')),
  update: (jobId, payload) => api.patch(idPath('/jobs', jobId), cleanParams(payload)).then((response) => unwrapEntity(response, 'job')),
  remove: (jobId) => api.delete(idPath('/jobs', jobId)),
  analyze: (jobId, options = {}) => api.post(`${idPath('/jobs', jobId, '/analyze')}${options?.force ? '?force=true' : ''}`, undefined, { timeout: AI_TIMEOUT }),
}

export const matchApi = {
  create: (jobId, resumeId, payload = {}) => api.post(`/jobs/${encodeURIComponent(jobId)}/match/${encodeURIComponent(resumeId)}`, cleanParams({ analysisId: payload?.analysisId, force: payload?.force }), { timeout: AI_TIMEOUT }).then((response) => ({
    match: unwrapEntity(response, 'match'),
    cached: Boolean(response?.cached),
  })),
  list: (params) => api.get('/matches', { params: listParams(params) }),
  get: (matchId) => api.get(idPath('/matches', matchId)).then((response) => unwrapEntity(response, 'match')),
  remove: (matchId) => api.delete(idPath('/matches', matchId)),
}

export const settingsApi = {
  get: () => api.get('/settings').then((response) => normalizeSettings(response)),
  update: (payload) => api.patch('/settings', cleanParams(payload)).then((response) => normalizeSettings(response)),
  changePassword: (payload) => api.put('/settings/password', cleanParams(payload)),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard', { timeout: AI_TIMEOUT }).then((response) => normalizeDashboard(response)),
  legacyStats: () => api.get('/dashboard/stats', { timeout: AI_TIMEOUT }),
}

export const healthApi = {
  check: () => api.get('/health', { baseURL: API_URL.replace(/\/api$/, ''), timeout: 10000 }),
}
