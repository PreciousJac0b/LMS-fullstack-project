import { useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/apiClient'

type ResendStatus = 'idle' | 'sending' | 'sent' | 'failed'

function VerifyEmailBanner() {
  const { user } = useAuth()
  const [status, setStatus] = useState<ResendStatus>('idle')
  const [message, setMessage] = useState('')

  async function resend() {
    setStatus('sending')

    try {
      const response = await api.post('/auth/verify-email/resend')
      setMessage(response.data.message)
      setStatus('sent')
    } catch (err: any) {
      setMessage(err.response?.data?.message ?? 'Could not send the email. Please try again.')
      setStatus('failed')
    }
  }

  if (!user || user.isEmailVerified) return null

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="space-y-1">
          <p className="font-medium">Please confirm your email address</p>
          <p className="text-muted-foreground">
            {status === 'sent' || status === 'failed'
              ? message
              : `We sent a confirmation link to ${user.email}.`}
          </p>
        </div>

        <Button
          disabled={status === 'sending' || status === 'sent'}
          onClick={resend}
          size="sm"
          type="button"
          variant="outline"
        >
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent' : 'Resend link'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default VerifyEmailBanner