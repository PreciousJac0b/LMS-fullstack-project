import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import { api } from '@/lib/apiClient'
import type { Lesson } from '@/types/course'

type EditLessonFormProps = {
  lesson: Lesson
  onSaved: (lesson: Lesson) => void
  onCancel: () => void
}

function EditLessonForm({ lesson, onSaved, onCancel }: EditLessonFormProps) {
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description ?? '')
  const [isPreview, setIsPreview] = useState(lesson.isPreview)
  const [minutes, setMinutes] = useState(String(Math.round(lesson.durationSeconds / 60)))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSaving(true)

    try {
      const response = await api.patch(`/lessons/${lesson._id}`, {
        title,
        description: description.trim(),
        isPreview,
        durationSeconds: Math.round(Number(minutes || 0) * 60),
      })
      onSaved(response.data.data)
    } catch (err: any) {
      const data = err.response?.data

      if (data?.code === 'VALIDATION_ERROR') {
        setFieldErrors(data.errors)
      }
      setError(data?.message ?? 'Could not save the lesson.')
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border p-4">
      <Field className="gap-2">
        <FieldLabel htmlFor={`title-${lesson._id}`}>Title</FieldLabel>
        <Input
          id={`title-${lesson._id}`}
          required
          value={title}
          aria-invalid={Boolean(fieldErrors.title)}
          onChange={(event) => {
            setTitle(event.target.value)
            clearFieldError('title')
          }}
        />
        <FieldError>{fieldErrors.title?.[0]}</FieldError>
      </Field>

      <Field className="gap-2">
        <FieldLabel htmlFor={`description-${lesson._id}`}>Description</FieldLabel>
        <Textarea
          id={`description-${lesson._id}`}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <Field className="gap-2">
        <FieldLabel>Who can watch it</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <Button
            aria-pressed={!isPreview}
            onClick={() => setIsPreview(false)}
            size="sm"
            type="button"
            variant={!isPreview ? 'default' : 'outline'}
          >
            Enrolled learners only
          </Button>
          <Button
            aria-pressed={isPreview}
            onClick={() => setIsPreview(true)}
            size="sm"
            type="button"
            variant={isPreview ? 'default' : 'outline'}
          >
            Free preview
          </Button>
        </div>
      </Field>

      <Field className="gap-2">
        <FieldLabel htmlFor={`minutes-${lesson._id}`}>Length (minutes)</FieldLabel>
        <Input
          id={`minutes-${lesson._id}`}
          inputMode="numeric"
          min={0}
          step={1}
          type="number"
          value={minutes}
          aria-invalid={Boolean(fieldErrors.durationSeconds)}
          onChange={(event) => {
            setMinutes(event.target.value)
            clearFieldError('durationSeconds')
          }}
        />
        <FieldError>{fieldErrors.durationSeconds?.[0]}</FieldError>
      </Field>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={isSaving || title.trim() === ''} type="submit">
          {isSaving ? 'Saving…' : 'Save lesson'}
        </Button>
      </div>
    </form>
  )
}

export default EditLessonForm