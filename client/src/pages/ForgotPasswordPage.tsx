import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import { api } from '@/lib/apiClient'

type RequestStatus = 'idle' | 'sending' | 'sent'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<RequestStatus>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setStatus('sending')

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message)
      setStatus('sent')
    } catch (err: any) {
      const data = err.response?.data

      if (data?.code === 'VALIDATION_ERROR') {
        setFieldErrors(data.errors)
      } else {
        setError(data?.message ?? 'Something went wrong. Please try again.')
      }

      setStatus('idle')
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg md:p-8">
        <h1 className="mb-1 text-center font-semibold text-2xl tracking-tight">
          Forgot your password?
        </h1>

        {status === 'sent' ? (
          <div className="space-y-6 text-center">
            <p className="text-muted-foreground text-sm">{message}</p>
            <p className="text-muted-foreground text-sm">
              The link expires in 1 hour. Check your spam folder if it doesn’t arrive.
            </p>
            <Button className="w-full rounded-full" nativeButton={false} render={<Link to="/login" />}>
              Back to log in
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-7 text-center text-muted-foreground text-sm">
              Enter your email and we’ll send you a link to choose a new one.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  autoComplete="email"
                  className="rounded-full px-4"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearFieldError('email')
                  }}
                />
                <FieldError>{fieldErrors.email?.[0]}</FieldError>
              </Field>

              {error && (
                <p className="text-center text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}

              <Button
                className="w-full rounded-full"
                disabled={status === 'sending'}
                size="lg"
                type="submit"
              >
                {status === 'sending' ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-muted-foreground text-sm">
              Remembered it?{' '}
              <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage