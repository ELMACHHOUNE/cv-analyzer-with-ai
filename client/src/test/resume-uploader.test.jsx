import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResumeUploader } from '@/components/ResumeUploader'

vi.mock('@/services/api', () => ({
  resumeApi: { upload: vi.fn() },
  getStoredToken: vi.fn(() => ''),
  setStoredToken: vi.fn(),
  UNAUTHORIZED_EVENT: 'cvision:unauthorized',
}))

function getFileInput() {
  const input = document.querySelector('input[type="file"]')
  if (!input) throw new Error('file input was not rendered')
  return input
}

describe('ResumeUploader', () => {
  it('opens the native file picker from the browse button', async () => {
    const user = userEvent.setup()
    render(<ResumeUploader />)
    const input = getFileInput()
    const clickSpy = vi.spyOn(input, 'click')
    await user.click(screen.getByRole('button', { name: /browse files/i }))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps the file input wired to the dropzone hook ref', () => {
    render(<ResumeUploader />)
    const input = getFileInput()
    expect(input.getAttribute('type')).toBe('file')
    expect(input.getAttribute('tabindex')).toBe('-1')
    expect(input.getAttribute('aria-label')).toBe('file upload')
  })
})
