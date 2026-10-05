import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/apiClient'
import type { CourseDetail, Lesson } from '@/types/course'
import { useAuth } from '@/auth/useAuth';
import { formatPrice } from '@/lib/format'

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function CourseDetailPage() {
  const { slug } = useParams()
  const location = useLocation();
  const { user, isRestoring } = useAuth()


  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCourse() {
      setIsLoading(true)
      setNotFound(false)
      setError('')

      try {
        const courseResponse = await api.get(`/courses/${slug}`, {
          signal: controller.signal,
        })
        const loadedCourse: CourseDetail = courseResponse.data.data
        setCourse(loadedCourse)

        const lessonsResponse = await api.get(
          `/lessons/courses/${loadedCourse._id}/lessons`,
          { signal: controller.signal },
        )
        setLessons(lessonsResponse.data.data.lessons)
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') return

        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(err.response?.data?.message ?? 'Could not load this course.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCourse()

    return () => controller.abort()
  }, [slug, user])

  useEffect(() => {
    if (!course || !user) {
      setIsEnrolled(false)
      return
    }

    const controller = new AbortController()

    async function checkEnrollment() {
      setIsCheckingEnrollment(true)

      try {
        const response = await api.get(`/enrollments/courses/${course!._id}`, {
          signal: controller.signal,
        })
        setIsEnrolled(response.data.data.isEnrolled)
      } catch (err: any) {
        if (err.code !== 'ERR_CANCELED') {
          setIsEnrolled(false)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingEnrollment(false)
        }
      }
    }

    checkEnrollment()

    return () => controller.abort()
  }, [course, user])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  async function handleFreeEnroll() {
    if (!course) return

    setEnrollError('')
    setIsEnrolling(true)

    try {
      await api.post(`/enrollments/courses/${course._id}`)
      setIsEnrolled(true)
    } catch (err: any) {
      setEnrollError(err.response?.data?.message ?? 'Could not enrol. Please try again.')
    } finally {
      setIsEnrolling(false)
    }
  }

  async function handleBuy() {
    if (!course) return

    setEnrollError('')
    setIsEnrolling(true)

    try {
      const response = await api.post(`/payments/pay/${course._id}`)
      // Leaving the app on purpose — Paystack's checkout is on their domain.
      window.location.href = response.data.data.authorizationUrl
    } catch (err: any) {
      setEnrollError(err.response?.data?.message ?? 'Could not start checkout. Please try again.')
      setIsEnrolling(false)
    }
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <h1 className="font-bold text-2xl">Course not found</h1>
        <p className="text-muted-foreground text-sm">
          It may have been unpublished, or the link may be wrong.
        </p>
        <Button render={<Link to="/" />} nativeButton={false}>
          Browse all courses
        </Button>
      </div>
    )
  }

  if (error || !course) {
    return <p className="text-destructive text-sm">{error || 'Something went wrong.'}</p>
  }

  const instructorNames = (course.instructors ?? [])
    .map((instructor) => `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim())
    .filter((name) => name !== '')
    .join(', ')

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{course.level}</Badge>
          {course.category && <Badge variant="outline">{course.category}</Badge>}
          {course.isFree && <Badge>Free</Badge>}
        </div>

        <h1 className="font-bold text-3xl leading-tight">{course.title}</h1>

        {instructorNames && (
          <p className="text-muted-foreground text-sm">Taught by {instructorNames}</p>
        )}

        <p className="max-w-2xl text-sm leading-relaxed">{course.description}</p>

        <div className="space-y-2">
          {isRestoring || isCheckingEnrollment ? (
            <Button disabled size="lg">Checking…</Button>
          ) : !user ? (
            <Button
              render={<Link to="/login" state={{ from: location }} />}
              nativeButton={false}
              size="lg"
            >
              Log in to enrol
            </Button>
          ) : isEnrolled ? (
            <Button render={<Link to={`/courses/${course.slug}/learn`} />} nativeButton={false} size="lg">
              Go to course
            </Button>
          ) : course.isFree || course.price <= 0 ? (
            <Button disabled={isEnrolling} onClick={handleFreeEnroll} size="lg">
              {isEnrolling ? 'Enrolling…' : 'Enrol for free'}
            </Button>
          ) : (
            <Button disabled={isEnrolling} onClick={handleBuy} size="lg">
              {isEnrolling ? 'Starting checkout…' : `Buy for ${formatPrice(course)}`}
            </Button>
          )}

          {enrollError && <p className="text-destructive text-sm">{enrollError}</p>}
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-xl">Preview lessons</h2>

        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            This course has no free preview lessons yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <li key={lesson._id}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle className="font-medium text-base">
                      {lesson.order}. {lesson.title}
                    </CardTitle>
                    <span className="whitespace-nowrap text-muted-foreground text-xs">
                      {lesson.contentType} · {formatDuration(lesson.durationSeconds)}
                    </span>
                  </CardHeader>
                  {lesson.description && (
                    <CardContent className="text-muted-foreground text-sm">
                      {lesson.description}
                    </CardContent>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default CourseDetailPage