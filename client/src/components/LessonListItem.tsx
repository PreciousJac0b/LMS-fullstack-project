import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import EditLessonForm from '@/components/EditLessonForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/apiClient'
import type { Lesson } from '@/types/course'

type RowMode = 'viewing' | 'editing' | 'confirmingDelete'

type LessonListItemProps = {
  lesson: Lesson
  isFirst: boolean
  isLast: boolean
  onSaved: (lesson: Lesson) => void
  onDeleted: (lesson: Lesson) => void
  onReordered: (lessons: Lesson[]) => void
}

function LessonListItem({ lesson, isFirst, isLast, onSaved, onDeleted, onReordered }: LessonListItemProps) {
  const [mode, setMode] = useState<RowMode>('viewing')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  async function move(direction: 'up' | 'down') {
    setIsBusy(true)
    setError('')

    try {
      const response = await api.patch(`/lessons/${lesson._id}/move`, { direction })
      onReordered(response.data.data.lessons)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Could not move the lesson.')
    } finally {
      setIsBusy(false)
    }
  }

  async function remove() {
    setIsBusy(true)
    setError('')

    try {
      await api.delete(`/lessons/${lesson._id}`)
      onDeleted(lesson)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Could not delete the lesson.')
      setIsBusy(false)
    }
  }

  if (mode === 'editing') {
    return (
      <li className="py-3">
        <EditLessonForm
          lesson={lesson}
          onCancel={() => setMode('viewing')}
          onSaved={(saved) => {
            onSaved(saved)
            setMode('viewing')
          }}
        />
      </li>
    )
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="min-w-0 space-y-1">
          <p className="truncate">
            {lesson.order}. {lesson.title}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground text-xs">
            {lesson.isPreview && <Badge variant="secondary">Preview</Badge>}
            {lesson.contentType} · {Math.max(1, Math.round(lesson.durationSeconds / 60))} min
          </p>
        </div>

        {mode === 'confirmingDelete' ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Delete this lesson and its file?</span>
            <Button disabled={isBusy} onClick={remove} size="sm" type="button" variant="destructive">
              {isBusy ? 'Deleting…' : 'Delete'}
            </Button>
            <Button disabled={isBusy} onClick={() => setMode('viewing')} size="sm" type="button" variant="ghost">
              Keep
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              aria-label="Move up"
              disabled={isBusy || isFirst}
              onClick={() => move('up')}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ArrowUp />
            </Button>
            <Button
              aria-label="Move down"
              disabled={isBusy || isLast}
              onClick={() => move('down')}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ArrowDown />
            </Button>
            <Button
              aria-label="Edit lesson"
              disabled={isBusy}
              onClick={() => setMode('editing')}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Pencil />
            </Button>
            <Button
              aria-label="Delete lesson"
              disabled={isBusy}
              onClick={() => setMode('confirmingDelete')}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </li>
  )
}

export default LessonListItem