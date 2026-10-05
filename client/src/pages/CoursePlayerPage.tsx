import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/apiClient'
import { CircleCheck } from 'lucide-react'
import type { CourseDetail, Enrollment, Lesson } from '@/types/course';


type LessonDetail = Lesson & {
  deliverableUrl?: string
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function LessonContent({ lesson }: { lesson: LessonDetail }) {
  if (!lesson.deliverableUrl) {
    return (
      <p className="text-muted-foreground text-sm">
        This lesson has no content attached yet.
      </p>
    )
  }

  if (lesson.contentType === 'video') {
    return (
      <video
        className="aspect-video w-full rounded-lg bg-black"
        controls
        key={lesson._id}
        src={lesson.deliverableUrl}
      />
    )
  }

  if (lesson.contentType === 'pdf' || lesson.contentType === 'slides') {
    return (
      <div className="space-y-3">
        <iframe
          className="h-[70vh] w-full rounded-lg border border-border"
          src={lesson.deliverableUrl}
          title={lesson.title}
        />
        <a
          className="text-muted-foreground text-sm underline underline-offset-4"
          href={lesson.deliverableUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open in a new tab
        </a>
      </div>
    )
  }

  return (
    <p className="text-muted-foreground text-sm">
      Quizzes aren’t available in the player yet.
    </p>
  )
}

function CoursePlayerPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [previewOnly, setPreviewOnly] = useState(false)
  const [isLoadingCourse, setIsLoadingCourse] = useState(true)
  const [error, setError] = useState('')

  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [lessonError, setLessonError] = useState('')
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedId = searchParams.get('lesson') ?? '';

  const completedIds = new Set(
    (enrollment?.lessonProgress ?? [])
      .filter((p) => p.completed)
      .map((p) => p.lesson),
  )
  const isCurrentDone = completedIds.has(selectedId)

  // Course + its lessons
  useEffect(() => {
    const controller = new AbortController()

    async function loadCourse() {
      setIsLoadingCourse(true)
      setError('')
      setEnrollment(null);

      try {
        const courseResponse = await api.get(`/courses/${slug}`, { signal: controller.signal })
        const loadedCourse: CourseDetail = courseResponse.data.data
        setCourse(loadedCourse)

        const lessonsResponse = await api.get(
          `/lessons/courses/${loadedCourse._id}/lessons`,
          { signal: controller.signal },
        )
        setLessons(lessonsResponse.data.data.lessons);
        setPreviewOnly(lessonsResponse.data.data.previewOnly);
        if (!lessonsResponse.data.data.previewOnly) {
          const enrollmentResponse = await api.get(
            `/enrollments/courses/${loadedCourse._id}`,
            { signal: controller.signal },
          )
          setEnrollment(enrollmentResponse.data.data.enrollment)
        }
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') return
        setError(err.response?.data?.message ?? 'Could not load this course.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCourse(false)
        }
      }
    }

    loadCourse()

    return () => controller.abort()
  }, [slug])

  // No lesson chosen yet? Select the first one.
  useEffect(() => {
    if (selectedId || lessons.length === 0) return

    const next = new URLSearchParams(searchParams)
    next.set('lesson', lessons[0]._id)
    setSearchParams(next, { replace: true })
  }, [selectedId, lessons, searchParams, setSearchParams])

  // The selected lesson's content (signed URLs expire, so always fetch fresh)
  useEffect(() => {
    if (!selectedId) return

    const controller = new AbortController()

    async function loadLesson() {
      setIsLoadingLesson(true)
      setLessonError('')

      try {
        const response = await api.get(`/lessons/${selectedId}`, { signal: controller.signal })
        setLesson(response.data.data)
      } catch (err: any) {
        if (err.code === 'ERR_CANCELED') return
        setLesson(null)
        setLessonError(err.response?.data?.message ?? 'Could not load this lesson.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLesson(false)
        }
      }
    }

    loadLesson()

    return () => controller.abort()
  }, [selectedId])

  function selectLesson(lessonId: string) {
    const next = new URLSearchParams(searchParams)
    next.set('lesson', lessonId)
    setSearchParams(next)
  }

  async function toggleComplete() {
    setIsSaving(true)
    setSaveError('')

    try {
      const response = await api.put(`/enrollments/lessons/${selectedId}/progress`, {
        completed: !isCurrentDone,
      })
      setEnrollment(response.data.data.enrollment) 
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? 'Could not save your progress.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingCourse) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-[50vh] w-full rounded-xl" />
      </div>
    )
  }

  if (error || !course) {
    return <p className="text-destructive text-sm">{error || 'Something went wrong.'}</p>
  }

  if (previewOnly) {
    return (
      <div className="space-y-4">
        <h1 className="font-bold text-2xl">{course.title}</h1>
        <p className="text-muted-foreground text-sm">
          You need to enrol in this course to use the player.
        </p>
        <Button render={<Link to={`/courses/${course.slug}`} />} nativeButton={false}>
          Back to the course page
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          className="text-muted-foreground text-sm underline underline-offset-4"
          to={`/courses/${course.slug}`}
        >
          ← {course.title}
        </Link>
        <h1 className="font-bold text-2xl leading-tight">{lesson?.title ?? 'Select a lesson'}</h1>
      </div>


      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {isLoadingLesson && <Skeleton className="aspect-video w-full rounded-lg" />}
          {!isLoadingLesson && lessonError && (
            <p className="text-destructive text-sm">{lessonError}</p>
          )}
          {!isLoadingLesson && !lessonError && lesson && <LessonContent lesson={lesson} />}

          {lesson && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={isSaving}
                onClick={toggleComplete}
                type="button"
                variant={isCurrentDone ? 'outline' : 'default'}
              >
                {isCurrentDone && <CircleCheck />}
                {isSaving ? 'Saving…' : isCurrentDone ? 'Completed · undo' : 'Mark as complete'}
              </Button>
              {saveError && <p className="text-destructive text-sm">{saveError}</p>}
            </div>
          )}
          {lesson?.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{lesson.description}</p>
          )}
        </div>

        <aside className="space-y-2">
          <h2 className="font-medium text-sm">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            {enrollment && ` · ${enrollment.completionPercentage}% complete`}
          </h2>

          <ul className="space-y-1">
            {lessons.map((item) => (
              <li key={item._id}>
                <button
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${item._id === selectedId
                    ? 'border-border bg-muted font-medium'
                    : 'border-transparent hover:bg-muted/60'
                    }`}
                  onClick={() => selectLesson(item._id)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {completedIds.has(item._id) && (
                        <CircleCheck className="size-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate">
                        {item.order}. {item.title}
                      </span>
                    </span>
                    {item.isPreview && <Badge variant="secondary">Free</Badge>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.contentType} · {formatDuration(item.durationSeconds)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default CoursePlayerPage