import { useState, type SubmitEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import { api } from '@/lib/apiClient'

const MIN_PASSWORD_LENGTH = 8

type ResetStatus = 'idle' | 'saving' | 'done'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { user, logout } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<ResetStatus>('idle')
  const [error, setError] = useState('')
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

  const passwordsMatch = password === confirmPassword
  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH
  const canSubmit = Boolean(token) && passwordsMatch && passwordLongEnough && status !== 'saving'

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setStatus('saving')

    try {
      await api.post('/auth/reset-password', { token, password })
    } catch (err: any) {
      const data = err.response?.data

      if (data?.code === 'VALIDATION_ERROR') {
        setFieldErrors(data.errors)
        setError(data.errors?.token?.[0] ?? 'Please fix the highlighted fields.')
      } else {
        setError(data?.message ?? 'Could not reset your password. Please try again.')
      }

      setStatus('idle')
      return
    }

    if (user) await logout()
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-lg md:p-8">
          <h1 className="font-semibold text-2xl tracking-tight">Password updated</h1>
          <p className="text-muted-foreground text-sm">
            For your safety we’ve signed you out on every device. Log in with your new password.
          </p>
          <Button className="w-full rounded-full" nativeButton={false} render={<Link to="/login" />}>
            Log in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg md:p-8">
        <h1 className="mb-1 text-center font-semibold text-2xl tracking-tight">
          Choose a new password
        </h1>
        <p className="mb-7 text-center text-muted-foreground text-sm">
          You’ll be signed out everywhere once it’s saved.
        </p>

        {!token ? (
          <p className="text-center text-destructive text-sm">
            This link is missing its code. Open the link from your email again.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field className="gap-2">
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                autoComplete="new-password"
                className="rounded-full px-4"
                id="password"
                minLength={MIN_PASSWORD_LENGTH}
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                }}
              />
              <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters.</FieldDescription>
              <FieldError>{fieldErrors.password?.[0]}</FieldError>
            </Field>

            <Field className="gap-2">
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input
                autoComplete="new-password"
                className="rounded-full px-4"
                id="confirm-password"
                name="confirm-password"
                placeholder="••••••••"
                required
                type="password"
                value={confirmPassword}
                aria-invalid={confirmPassword !== '' && !passwordsMatch}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {confirmPassword !== '' && !passwordsMatch && (
                <FieldError>Passwords do not match.</FieldError>
              )}
            </Field>

            {error && (
              <p className="text-center text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            <Button
              className="w-full rounded-full"
              disabled={!canSubmit}
              size="lg"
              type="submit"
            >
              {status === 'saving' ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-muted-foreground text-sm">
          Link expired or already used?{' '}
          <Link to="/forgot-password" className="font-medium text-foreground underline underline-offset-4">
            Request a new one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage