import { useEffect, useState, type ReactNode } from 'react'
import { api, setAccessToken, setOnAuthFailure } from '@/lib/apiClient'
import { AuthContext, type User, type SignupInput } from './authContext';


type AuthProviderProps = {
  children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await api.get('/auth/me');
        if (!cancelled) {
          setUser(response.data.data);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    }
  }, [])

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
    })

    return () => {
      setOnAuthFailure(null);
    }
  }, [])

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    setAccessToken(response.data.data.accessToken)
    setUser(response.data.data.user)
  }

  async function signup(input: SignupInput) {
    await api.post('/auth/signup', input);
    await login(input.email, input.password);
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext value={{ user, isRestoring, login, signup, logout }}>
      {children}
    </AuthContext>
  )
}

export default AuthProvider