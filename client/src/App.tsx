
import { Routes, Route } from 'react-router-dom'
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
import VerifyEmailPage from './pages/VerifyEmailPage'
import VerifyEmailBanner from './components/VerifyEmailBanner'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TeachCoursesPage from './pages/TeachCoursesPage'
import NewCoursePage from './pages/NewCoursePage'
import CourseEditorPage from './pages/CourseEditorPage'

function App() {
  // const { user, isRestoring, logout } = useAuth();
  return (
    <>
      <Navbar />


      <main className="mx-auto max-w-5xl space-y-8 px-4 pt-32 pb-16 md:px-8">
        <VerifyEmailBanner />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <Route
            path="/teach"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <TeachCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teach/new"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <NewCoursePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teach/courses/:courseId"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <CourseEditorPage />
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
