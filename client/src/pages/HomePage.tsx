import WelcomeBanner from '@/components/WelcomeBanner'
import CourseSearch from '@/components/CourseSearch'
import { useAuth } from '@/auth/useAuth'

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Courses</h1>

      {user && (
        <WelcomeBanner
          name={user.firstName ?? user.email}
          courseCount={user.enrollments?.length ?? 0}
        />
      )}

      <CourseSearch />
    </div>
  )
}

export default HomePage