import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/useAuth'

function LoginPage() {
    const { user, login } = useAuth()
    const [message, setMessage] = useState('')

    async function handleTestLogin() {
        try {
            await login(import.meta.env.VITE_TEST_EMAIL, import.meta.env.VITE_TEST_PASSWORD)
            setMessage('Logged in through the AuthProvider.')
        } catch (error: any) {
            setMessage(`Login failed: ${error.response?.data?.message ?? String(error)}`)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Log in</h1>
            <Button onClick={handleTestLogin}>Test login</Button>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-sm">Context says: {user ? user.email : 'nobody is logged in'}</p>
        </div>
    )
}

export default LoginPage