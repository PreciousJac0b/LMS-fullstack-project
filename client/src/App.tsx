
import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { Button } from '@/components/ui/button'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './auth/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import SignupPage from './pages/SignupPage'
import CourseDetailPage from './pages/CourseDetailPage'

function App() {
  const { user, isRestoring, logout } = useAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <nav className="flex gap-4 border-b pb-4">
        <Link to="/" className="text-sm font-medium hover:underline">
          Courses
        </Link>
        {user && (
          <Link to="/dashboard" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {isRestoring ? (
            <span className="text-sm text-muted-foreground">Checking session…</span>
          )
            : user ?
              (<>
                <span className="text-sm text-muted-foreground">
                  Hi, {user.firstName ?? user.email}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Log out
                </Button>
              </>)
              :
              <>
                <Link to="/login" className="text-sm font-medium hover:underline">
                  Log in
                </Link>
                <Link to="/signup" className="text-sm font-medium hover:underline">
                  Sign Up
                </Link>
              </>

          }

        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
