import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/apiClient'

type VerifyStatus = 'idle' | 'verifying' | 'verified' | 'failed'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { user, refreshUser } = useAuth()

  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [error, setError] = useState('')

  async function confirmEmail() {
    setStatus('verifying')
    setError('')

    try {
      await api.post('/auth/verify-email', { token })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Could not confirm your email.')
      setStatus('failed')
      return
    }

    setStatus('verified')
    if (user) await refreshUser() // so the reminder banner disappears straight away
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Confirm your email</CardTitle>
        <CardDescription>
          {status === 'verified'
            ? 'All done. Your email address is confirmed.'
            : 'One click and your account is confirmed.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!token && (
          <p className="text-destructive text-sm">
            This link is missing its code. Open the link from your email again.
          </p>
        )}

        {token && status !== 'verified' && (
          <Button
            className="w-full"
            disabled={status === 'verifying'}
            onClick={confirmEmail}
            type="button"
          >
            {status === 'verifying' ? 'Confirming…' : 'Confirm my email'}
          </Button>
        )}

        {status === 'failed' && (
          <p className="text-destructive text-sm">
            {error} {user ? 'Use “Resend link” at the top of the page to get a new one.' : 'Log in to request a new link.'}
          </p>
        )}

        {status === 'verified' && (
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link to={user ? '/dashboard' : '/login'} />}
          >
            {user ? 'Go to my dashboard' : 'Log in'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default VerifyEmailPage