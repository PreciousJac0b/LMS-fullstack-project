import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CourseForm, { type CoursePayload } from '@/components/CourseForm'
import CourseStatusBadge from '@/components/CourseStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/apiClient'
import type { CourseStatus, Lesson, ManagedCourse } from '@/types/course'
import AddLessonForm from '@/components/AddLessonForm'
import LessonListItem from '@/components/LessonListItem'

function CourseEditorPage() {
    const { courseId } = useParams()

    const [course, setCourse] = useState<ManagedCourse | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const [savedMessage, setSavedMessage] = useState('')
    const [isChangingStatus, setIsChangingStatus] = useState(false)
    const [statusError, setStatusError] = useState('')
    const [isAddingLesson, setIsAddingLesson] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        async function loadCourse() {
            setIsLoading(true)
            setError('')

            try {
                const response = await api.get(`/courses/${courseId}/manage`, { signal: controller.signal })
                setCourse(response.data.data.course)
                setLessons(response.data.data.lessons)
            } catch (err: any) {
                if (err.code === 'ERR_CANCELED') return
                setError(err.response?.data?.message ?? 'Could not load this course.')
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        loadCourse()

        return () => controller.abort()
    }, [courseId])

    async function saveDetails(payload: CoursePayload) {
        setSavedMessage('')
        const response = await api.patch(`/courses/${courseId}`, payload)
        setCourse(response.data.data)
        setSavedMessage('Changes saved.')
    }

    async function changeStatus(status: CourseStatus) {
        setIsChangingStatus(true)
        setStatusError('')

        try {
            const response = await api.patch(`/courses/${courseId}`, { status })
            setCourse(response.data.data)
        } catch (err: any) {
            setStatusError(err.response?.data?.message ?? 'Could not change the status.')
        } finally {
            setIsChangingStatus(false)
        }
    }

    function handleLessonCreated(lesson: Lesson) {
        setLessons([...lessons, lesson])
        setIsAddingLesson(false)
    }

    function handleLessonSaved(saved: Lesson) {
        setLessons(lessons.map((lesson) => (lesson._id === saved._id ? saved : lesson)))
    }

    function handleLessonDeleted(removed: Lesson) {
        setLessons(
            lessons
                .filter((lesson) => lesson._id !== removed._id)
                .map((lesson) => (lesson.order > removed.order ? { ...lesson, order: lesson.order - 1 } : lesson)),
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="space-y-4">
                <p className="text-destructive text-sm">{error || 'Something went wrong.'}</p>
                <Link className="text-muted-foreground text-sm underline underline-offset-4" to="/teach">
                    ← My courses
                </Link>
            </div>
        )
    }

    const isPublished = course.status === 'published'

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Link className="text-muted-foreground text-sm underline underline-offset-4" to="/teach">
                    ← My courses
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-bold text-3xl leading-tight">{course.title}</h1>
                    <CourseStatusBadge status={course.status} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visibility</CardTitle>
                    <CardDescription>
                        {isPublished
                            ? 'Live in the catalogue. Learners can find, buy and enrol in it.'
                            : 'Hidden from learners. Publish it when it is ready.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {isPublished ? (
                            <>
                                <Button
                                    disabled={isChangingStatus}
                                    onClick={() => changeStatus('unpublished')}
                                    type="button"
                                    variant="outline"
                                >
                                    {isChangingStatus ? 'Updating…' : 'Unpublish'}
                                </Button>
                                <Button nativeButton={false} render={<Link to={`/courses/${course.slug}`} />} variant="ghost">
                                    View live page
                                </Button>
                            </>
                        ) : (
                            <Button
                                disabled={isChangingStatus || lessons.length === 0}
                                onClick={() => changeStatus('published')}
                                type="button"
                            >
                                {isChangingStatus ? 'Publishing…' : 'Publish'}
                            </Button>
                        )}
                    </div>

                    {!isPublished && lessons.length === 0 && (
                        <p className="text-muted-foreground text-sm">Add at least one lesson before publishing.</p>
                    )}
                    {isPublished && (
                        <p className="text-muted-foreground text-sm">
                            Unpublishing also hides the course from learners who are already enrolled.
                        </p>
                    )}
                    {statusError && <p className="text-destructive text-sm">{statusError}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                    <CardDescription>Changing the title also changes the course’s web address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <CourseForm
                        initialValues={course}
                        onSubmit={saveDetails}
                        submitLabel="Save changes"
                        submittingLabel="Saving…"
                    />
                    {savedMessage && <p className="text-muted-foreground text-sm">{savedMessage}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lessons</CardTitle>
                    <CardDescription>
                        {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {lessons.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No lessons yet.</p>
                    ) : (
                         <ul className="divide-y divide-border">
                            {lessons.map((lesson, index) => (
                                <LessonListItem
                                    key={lesson._id}
                                    isFirst={index === 0}
                                    isLast={index === lessons.length - 1}
                                    lesson={lesson}
                                    onDeleted={handleLessonDeleted}
                                    onReordered={setLessons}
                                    onSaved={handleLessonSaved}
                                />
                            ))}
                        </ul>
                    )}

                    {isAddingLesson ? (
                        <AddLessonForm
                            courseId={course._id}
                            onCancel={() => setIsAddingLesson(false)}
                            onCreated={handleLessonCreated}
                        />
                    ) : (
                        <Button onClick={() => setIsAddingLesson(true)} type="button" variant="outline">
                            Add lesson
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default CourseEditorPage