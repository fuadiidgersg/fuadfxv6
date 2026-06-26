import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent, type Locator } from 'vitest/browser'
import { ForgotPasswordForm } from './forgot-password-form'

const resetPasswordMock = vi.hoisted(() => vi.fn(() => Promise.resolve()))
const toastSuccessMock = vi.hoisted(() => vi.fn())
const toastErrorMock = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

vi.mock('@/lib/supabase/auth', () => ({
  resetPassword: resetPasswordMock,
}))

describe('ForgotPasswordForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let continueButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()

    screen = await render(<ForgotPasswordForm />)
    emailInput = screen.getByRole('textbox', { name: /^Email$/i })
    continueButton = screen.getByRole('button', { name: /^Continue$/i })
  })

  it('renders email field and continue button', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(continueButton).toBeInTheDocument()
  })

  it('shows validation when submitting empty form', async () => {
    await userEvent.click(continueButton)
    await expect
      .element(screen.getByText(/^Please enter your email\.$/i))
      .toBeInTheDocument()
  })

  it('resets the form and shows confirmation on success', async () => {
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.click(continueButton)

    await vi.waitFor(() =>
      expect(resetPasswordMock).toHaveBeenCalledWith('a@b.com')
    )

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Password reset email sent to a@b.com'
    )
    await expect
      .element(screen.getByText(/password reset link has been sent/i))
      .toBeInTheDocument()
  })
})
