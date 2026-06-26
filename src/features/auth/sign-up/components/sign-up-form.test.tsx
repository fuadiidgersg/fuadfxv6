import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { SignUpForm } from './sign-up-form'

const FORM_MESSAGES = {
  emailEmpty: 'Please enter your email.',
  passwordEmpty: 'Please enter your password.',
  confirmPasswordEmpty: 'Please confirm your password.',
  passwordMismatch: "Passwords don't match.",
} as const

const navigateMock = vi.hoisted(() => vi.fn())
const signUpMock = vi.hoisted(() =>
  vi.fn(
    () =>
      new Promise<{ user: { id: string }; session: { access_token: string } }>(
        (resolve) => {
          window.setTimeout(
            () =>
              resolve({
                user: { id: 'user-1' },
                session: { access_token: 'token' },
              }),
            2000
          )
        }
      )
  )
)
const signInWithGoogleMock = vi.hoisted(() => vi.fn())
const toastSuccessMock = vi.hoisted(() => vi.fn())
const toastErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

vi.mock('@/lib/supabase/auth', () => ({
  signUp: signUpMock,
  signInWithGoogle: signInWithGoogleMock,
}))

describe('SignUpForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let passwordInput: Locator
  let confirmPasswordInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()

    screen = await render(<SignUpForm />)
    emailInput = screen.getByRole('textbox', { name: /^Email$/i })
    passwordInput = screen.getByLabelText(/^Password$/i)
    confirmPasswordInput = screen.getByLabelText(/^Confirm Password$/i)
    submitButton = screen.getByRole('button', { name: /^Create Account$/i })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders fields and submit button', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(confirmPasswordInput).toBeInTheDocument()
    await expect.element(submitButton).toBeInTheDocument()
  })

  it('shows validation messages when submitting empty form', async () => {
    await userEvent.click(submitButton)

    await expect
      .element(screen.getByText(FORM_MESSAGES.emailEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText(FORM_MESSAGES.confirmPasswordEmpty))
      .toBeInTheDocument()
  })

  it('shows a mismatch error when passwords do not match', async () => {
    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '7654321')

    await userEvent.click(submitButton)
    await expect
      .element(screen.getByText(FORM_MESSAGES.passwordMismatch))
      .toBeInTheDocument()
  })

  it('disables submit while submitting and re-enables after timeout', async () => {
    vi.useFakeTimers()

    await userEvent.fill(emailInput, 'a@b.com')
    await userEvent.fill(passwordInput, '1234567')
    await userEvent.fill(confirmPasswordInput, '1234567')

    await userEvent.click(submitButton)
    await expect.element(submitButton).toBeDisabled()

    await vi.advanceTimersByTimeAsync(2000)
    await expect.element(submitButton).toBeEnabled()
    expect(signUpMock).toHaveBeenCalledOnce()
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Account created for a@b.com.'
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/onboarding',
      replace: true,
    })
  })
})
