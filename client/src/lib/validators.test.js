import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE, validateFile, validateJobForm, validateRegisterForm } from '@/lib/validators'

describe('client validators', () => {
  it('accepts supported files under the size limit and rejects unsafe files', () => {
    expect(validateFile({ name: 'cv.pdf', type: 'application/pdf', size: 1024 })).toBe('')
    expect(validateFile({ name: 'cv.exe', type: 'application/octet-stream', size: 1024 })).toContain('Use a PDF')
    expect(validateFile({ name: 'cv.pdf', type: 'application/pdf', size: MAX_FILE_SIZE + 1 })).toContain('10 MB')
  })

  it('requires a useful job description before matching', () => {
    const errors = validateJobForm({ title: 'Frontend engineer', company: 'Acme', description: 'React role' })
    expect(errors.description).toBeDefined()
    expect(validateJobForm({ title: 'Frontend engineer', company: 'Acme', description: 'A'.repeat(100), url: 'https://example.com' })).toEqual({})
  })

  it('enforces registration password length', () => {
    expect(validateRegisterForm({ name: 'A', email: 'bad', password: 'short' })).toEqual({
      name: 'Name must be at least 2 characters.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
    })
  })
})
