import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { UserRole } from './authContext'
import { useAuth } from './useAuth'

type ProtectedRouteProps = {
  children: ReactNode
  roles?: UserRole[]
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <p className="text-muted-foreground text-sm">Checking session…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-semibold text-2xl">This area is for instructors</h1>
        <p className="text-muted-foreground text-sm">Your account doesn’t have access to this page.</p>
        <Button nativeButton={false} render={<Link to="/" />}>
          Back to courses
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute