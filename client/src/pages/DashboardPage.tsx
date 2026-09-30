import { useAuth } from '@/auth/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>Enrolled courses: {user?.enrollments?.length ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage