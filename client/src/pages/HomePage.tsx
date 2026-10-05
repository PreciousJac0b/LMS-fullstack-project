import WelcomeBanner from '@/components/WelcomeBanner'
import CourseSearch from '@/components/CourseSearch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/useAuth'
import { api } from '@/lib/apiClient'
import type { Course } from '@/types/course'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CourseCard from '@/components/CourseCard'
import { Button } from '@/components/ui/button'

const DEBOUNCE_MS = 400

function HomePage() {
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const [searchText, setSearchText] = useState(query);

  const [courses, setCourses] = useState<Course[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    if (searchText === query) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);

      if (searchText == '') {
        next.delete('q')
      } else {
        next.set('q', searchText);
      }

      next.delete('page');
      setSearchParams(next, { replace: true })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer);
  }, [searchText, query, searchParams, setSearchParams])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCourses() {
      setIsLoading(true)
      setError('')

      try {
        const response = await api.get('/courses',
          {
            params: {
              q: query || undefined,
              page,
              limit: 9,
            },
            signal: controller.signal
          },
        )
        setCourses(response.data.data.courses)
        setTotalPages(response.data.data.pagination.totalPages)
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') {
          return
        }
        setError(err.response?.data?.message ?? 'Could not load courses right now.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCourses()

    return () => controller.abort()
  }, [query, page])


  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Courses</h1>

      {user && (
        <WelcomeBanner
          name={user.firstName ?? user.email}
        />
      )}

      <CourseSearch value={searchText} onChange={setSearchText} />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((placeholder) => (
            <Skeleton key={placeholder} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No published courses yet. Check back soon.
        </p>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>

              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>


      )}
    </div>
  )
}

export default HomePage