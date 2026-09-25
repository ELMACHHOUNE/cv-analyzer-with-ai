export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_RESUME_NAME_LENGTH = 100
export const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'jpg', 'jpeg', 'png']
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

export function getFileExtension(name = '') {
  return String(name).split('.').pop()?.toLowerCase() || ''
}

export function validateFile(file) {
  if (!file) return 'Choose a CV file to continue.'
  const extension = getFileExtension(file.name)
  const supported = SUPPORTED_EXTENSIONS.includes(extension) || SUPPORTED_MIME_TYPES.includes(file.type)
  if (!supported) return 'Use a PDF, DOCX, JPG, JPEG, or PNG file.'
  if (file.size > MAX_FILE_SIZE) return 'The file must be smaller than 10 MB.'
  if (file.size === 0) return 'The selected file is empty.'
  return ''
}

export function truncateResumeName(value, fallback = '') {
  const preferred = String(value || '').trim()
  const source = preferred || String(fallback || '').trim()
  if (source.length <= MAX_RESUME_NAME_LENGTH) return source
  return source.slice(0, MAX_RESUME_NAME_LENGTH)
}

export function validateLoginForm(values = {}) {
  const errors = {}
  if (!values.email?.trim()) errors.email = 'Email is required.'
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Password is required.'
  return errors
}

export function validateRegisterForm(values = {}) {
  const errors = validateLoginForm(values)
  if (!values.name?.trim()) errors.name = 'Name is required.'
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'
  if (values.password && values.password.length < 8) errors.password = 'Use at least 8 characters.'
  return errors
}

export function validateJobForm(values = {}) {
  const errors = {}
  if (!values.title?.trim()) errors.title = 'Job title is required.'
  if (!values.company?.trim()) errors.company = 'Company is required.'
  if (!values.description?.trim()) errors.description = 'Paste a job description to match against.'
  else if (values.description.trim().length < 80) errors.description = 'Add a little more detail (at least 80 characters).'
  if (values.url && !/^https?:\/\//i.test(values.url.trim())) errors.url = 'Use a URL beginning with http:// or https://.'
  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors || {}).length > 0
}
