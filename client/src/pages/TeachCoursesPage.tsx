import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseStatusBadge from '@/components/CourseStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/apiClient'
import { formatPrice } from '@/lib/format'
import type { InstructorCourse } from '@/types/course'


function TeachCoursesPage() {
    const [courses, setCourses] = useState<InstructorCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadCourses() {
            setIsLoading(true)
            setError('')

            try {
                const response = await api.get('/courses/mine', { signal: controller.signal })
                setCourses(response.data.data.courses)
            } catch (err: any) {
                if (err.code === 'ERR_CANCELED') return
                setError(err.response?.data?.message ?? 'Could not load your courses.')
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        loadCourses()

        return () => controller.abort()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-bold text-3xl">My courses</h1>
                    <p className="text-muted-foreground text-sm">Create, edit and publish the courses you teach.</p>
                </div>
                <Button nativeButton={false} render={<Link to="/teach/new" />}>
                    New course
                </Button>
            </div>

            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2].map((placeholder) => (
                        <Skeleton key={placeholder} className="h-36 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {!isLoading && error && <p className="text-destructive text-sm">{error}</p>}

            {!isLoading && !error && courses.length === 0 && (
                <Card>
                    <CardContent className="space-y-3 py-8 text-center">
                        <p className="text-muted-foreground text-sm">You haven’t created a course yet.</p>
                        <Button nativeButton={false} render={<Link to="/teach/new" />}>
                            Create your first course
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !error && courses.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {courses.map((course) => (
                        <Card key={course._id} className="flex flex-col">
                            <CardHeader className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
                                    <CourseStatusBadge status={course.status} />
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {formatPrice(course)} · {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'} ·{' '}
                                    {course.enrollmentCount} enrolled
                                </p>
                            </CardHeader>

                            <CardContent className="mt-auto flex items-center justify-between gap-3">
                                <span className="text-muted-foreground text-xs">
                                    Updated {new Date(course.updatedAt).toLocaleDateString()}
                                </span>
                                <Button
                                    nativeButton={false}
                                    render={<Link to={`/teach/courses/${course._id}`} />}
                                    size="sm"
                                    variant="outline"
                                >
                                    Edit
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default TeachCoursesPage