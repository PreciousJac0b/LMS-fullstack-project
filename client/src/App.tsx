
import { Routes, Route, Link } from 'react-router-dom'
// import { useAuth } from './auth/useAuth'
// import { Button } from '@/components/ui/button'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './auth/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import SignupPage from './pages/SignupPage'
import CourseDetailPage from './pages/CourseDetailPage'
import Navbar from './components/Navbar'
import PaymentCallbackPage from './pages/PaymentCallbackPage'
import CoursePlayerPage from './pages/CoursePlayerPage'

function App() {
  // const { user, isRestoring, logout } = useAuth();
  return (
    <>
      <Navbar />


      <main className="mx-auto max-w-5xl space-y-8 px-4 pt-32 pb-16 md:px-8">
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
          <Route
            path="/courses/:slug/learn"
            element={
              <ProtectedRoute>
                <CoursePlayerPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main >
    </>
  )
}

export default App
