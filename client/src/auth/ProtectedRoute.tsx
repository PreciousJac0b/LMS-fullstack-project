import type {ReactNode} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

type ProtectedRouteProps = {
    children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <p className="text-sm text-muted-foreground">Checking session…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute