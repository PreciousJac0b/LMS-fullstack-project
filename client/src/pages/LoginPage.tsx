import { useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFieldErrors } from '@/hooks/useFieldErrors'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      const data = err.response?.data

      if (data?.code === 'VALIDATION_ERROR') {
        setFieldErrors(data.errors)
        setError('Please fix the highlighted fields.')
      } else {
        setError(data?.message ?? 'Could not log in. Please try again.')
      }

      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg md:p-8">
        <h1 className="mb-1 text-center font-semibold text-2xl tracking-tight">
          Welcome back
        </h1>
        <p className="mb-7 text-center text-muted-foreground text-sm">
          Log in to pick up where you left off.
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

          <Field className="gap-2">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              autoComplete="current-password"
              className="rounded-full px-4"
              id="password"
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
            <FieldError>{fieldErrors.password?.[0]}</FieldError>
          </Field>

          <div className="text-right">
            <Link
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="text-center text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <Button
            className="w-full rounded-full"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          Don’t have an account?{' '}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage