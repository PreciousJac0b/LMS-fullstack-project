import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/apiClient'
import type { MyEnrollment } from '@/types/course'

function DashboardPage() {
  const { user } = useAuth()

  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadEnrollments() {
      setIsLoading(true)
      setError('')

      try {
        const response = await api.get('/enrollments/me', { signal: controller.signal })
        setEnrollments(response.data.data.enrollments)
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') return
        setError(err.response?.data?.message ?? 'Could not load your courses.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadEnrollments()

    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl">My learning</h1>
        <p className="text-muted-foreground text-sm">
          {user?.firstName ? `${user.firstName}, you` : 'You'} are enrolled in{' '}
          {isLoading ? '…' : enrollments.length}{' '}
          {enrollments.length === 1 ? 'course' : 'courses'}.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((placeholder) => (
            <Skeleton key={placeholder} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && error && <p className="text-destructive text-sm">{error}</p>}

      {!isLoading && !error && enrollments.length === 0 && (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              You haven’t enrolled in anything yet.
            </p>
            <Button render={<Link to="/" />} nativeButton={false}>
              Browse courses
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && enrollments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((enrollment) => (
            <Card key={enrollment._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base leading-snug">
                  <Link to={`/courses/${enrollment.course.slug}`} className="hover:underline">
                    {enrollment.course.title}
                  </Link>
                </CardTitle>
              </CardHeader>

              <CardContent className="mt-auto flex items-center justify-between gap-3">
                <Badge variant="secondary">{enrollment.course.level}</Badge>
                <span className="text-muted-foreground text-xs">
                  {enrollment.completionPercentage}% complete
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DashboardPage