import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/apiClient'

type Status = 'verifying' | 'success' | 'failed'

function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const { isRestoring } = useAuth()

  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')

  const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? ''

  useEffect(() => {
    // Wait until the session is restored, or the request goes out with no token.
    if (isRestoring) return

    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference was provided.')
      return
    }

    const controller = new AbortController()

    async function verify() {
      try {
        const response = await api.get(`/payments/pay/verify/${reference}`, {
          signal: controller.signal,
        })
        setStatus('success')
        setMessage(response.data.message)
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') return
        setStatus('failed')
        setMessage(err.response?.data?.message ?? 'We could not confirm this payment.')
      }
    }

    verify()

    return () => controller.abort()
  }, [reference, isRestoring])

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      {status === 'verifying' && (
        <>
          <h1 className="font-semibold text-2xl">Confirming your payment…</h1>
          <p className="text-muted-foreground text-sm">This usually takes a few seconds.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h1 className="font-semibold text-2xl">You’re enrolled</h1>
          <p className="text-muted-foreground text-sm">{message}</p>
          <Button render={<Link to="/dashboard" />} nativeButton={false}>
            Go to my learning
          </Button>
        </>
      )}

      {status === 'failed' && (
        <>
          <h1 className="font-semibold text-2xl">Payment not confirmed</h1>
          <p className="text-destructive text-sm">{message}</p>
          <p className="text-muted-foreground text-xs">
            If you were charged, your enrolment will appear shortly — our server is also notified
            directly by Paystack.
          </p>
          <Button render={<Link to="/" />} nativeButton={false} variant="outline">
            Back to courses
          </Button>
        </>
      )}
    </div>
  )
}

export default PaymentCallbackPage