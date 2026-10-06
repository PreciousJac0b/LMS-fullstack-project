import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import { Separator } from '@/components/ui/separator'

const MIN_PASSWORD_LENGTH = 8

function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

  const passwordsMatch = password === confirmPassword
  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH
  const canSubmit = passwordsMatch && passwordLongEnough && !isSubmitting

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await signup({ firstName, lastName, email, password })
      navigate('/', { replace: true })
    } catch (err: any) {
      const data = err.response?.data

      if (data?.code === 'VALIDATION_ERROR') {
        setFieldErrors(data.errors)
        setError('Please fix the highlighted fields.')
      } else if (data?.code === 'USER_EXISTS') {
        setFieldErrors({ email: ['An account with this email already exists. Try logging in.'] })
      } else {
        setError(data?.message ?? 'Could not create your account. Please try again.')
      }

      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-full sm:mx-auto sm:max-w-2xl">
        <h3 className="text-balance font-semibold text-2xl text-foreground">
          Create your account
        </h3>
        <p className="mt-1 text-pretty text-muted-foreground text-sm">
          A few details and you can start learning.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="first-name">
                  First name
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  autoComplete="given-name"
                  id="first-name"
                  name="first-name"
                  placeholder="First name"
                  required
                  type="text"
                  value={firstName}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  onChange={(event) => {
                    setFirstName(event.target.value)
                    clearFieldError('firstName')
                  }}
                />
                <FieldError>{fieldErrors.firstName?.[0]}</FieldError>
              </Field>
            </div>

            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="last-name">
                  Last name
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  autoComplete="family-name"
                  id="last-name"
                  name="last-name"
                  placeholder="Last name"
                  required
                  type="text"
                  value={lastName}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  onChange={(event) => {
                    setLastName(event.target.value)
                    clearFieldError('lastName')
                  }}
                />
                <FieldError>{fieldErrors.lastName?.[0]}</FieldError>
              </Field>
            </div>

            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">
                  Email
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  autoComplete="email"
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
            </div>

            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="password">
                  Password
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="password"
                  name="password"
                  minLength={MIN_PASSWORD_LENGTH}
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
                <FieldDescription>
                  At least {MIN_PASSWORD_LENGTH} characters.
                </FieldDescription>
                <FieldError>{fieldErrors.password?.[0]}</FieldError>
              </Field>
            </div>

            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="confirm-password">
                  Confirm password
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  name="confirm-password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                {confirmPassword !== '' && !passwordsMatch && (
                  <p className="text-destructive text-xs">Passwords do not match.</p>
                )}
              </Field>
            </div>
          </div>

          {error && <p className="mt-6 text-destructive text-sm">{error}</p>}

          <Separator className="my-6" />

          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-foreground hover:underline">
                Log in
              </Link>
            </p>

            <Button className="whitespace-nowrap" type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupPage