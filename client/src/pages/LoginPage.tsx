import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@base-ui/react/input'

function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('')
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate(from, { replace: true })
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Could not log in. Please try again.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-sm">
            <Card>
                <CardHeader>
                    <CardTitle>Log in</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging in…' : 'Log in'}
                        </Button>
                    </form>
                </CardContent>
            </Card >
        </div>
    )
}

export default LoginPage