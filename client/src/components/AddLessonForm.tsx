import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import { api } from '@/lib/apiClient'
import { uploadToCloudinary } from '@/lib/cloudinaryUpload'
import type { Lesson } from '@/types/course'

type UploadType = 'video' | 'pdf' | 'slides'

type UploadStep = 'idle' | 'uploading' | 'saving'

const contentTypes: { value: UploadType; label: string; accept: string; maxMb: number }[] = [
    { value: 'video', label: 'Video', accept: 'video/*', maxMb: 100 },
    { value: 'pdf', label: 'PDF', accept: 'application/pdf', maxMb: 10 },
    { value: 'slides', label: 'Slides', accept: '.pdf,.ppt,.pptx,.key', maxMb: 10 },
]

const stepLabel: Record<UploadStep, string> = {
    idle: 'Add lesson',
    uploading: 'Uploading…',
    saving: 'Saving…',
}

type AddLessonFormProps = {
    courseId: string
    onCreated: (lesson: Lesson) => void
    onCancel: () => void
}

function AddLessonForm({ courseId, onCreated, onCancel }: AddLessonFormProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [contentType, setContentType] = useState<UploadType>('video')
    const [isPreview, setIsPreview] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [minutes, setMinutes] = useState('')
    const [step, setStep] = useState<UploadStep>('idle')
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')
    const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

    const selectedType = contentTypes.find((option) => option.value === contentType)!
    const isBusy = step !== 'idle'
    const canSubmit = Boolean(file) && title.trim() !== '' && !isBusy

    function chooseContentType(value: UploadType) {
        setContentType(value)
        setFile(null)
        clearFieldError('file')
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!file) return

        setError('')
        setFieldErrors({})

        if (file.size > selectedType.maxMb * 1024 * 1024) {
            setFieldErrors({ file: [`This file is too large. The limit is ${selectedType.maxMb} MB.`] })
            return
        }

        try {
            setStep('uploading')
            setProgress(0)
            const uploaded = await uploadToCloudinary(file, {
                kind: contentType,
                isPublic: isPreview,
                onProgress: setProgress,
            })
            const durationSeconds =
                contentType === 'video' && uploaded.duration
                    ? Math.round(uploaded.duration)
                    : Math.round(Number(minutes || 0) * 60)

            const lessonResponse = await api.post(`/lessons/courses/${courseId}/lessons`, {
                title,
                description: description.trim() || undefined,
                contentType,
                isPreview,
                deliveryType: isPreview ? 'upload' : 'authenticated',
                durationSeconds,
                [contentType]: { url: uploaded.secure_url, publicId: uploaded.public_id },
            })

            onCreated(lessonResponse.data.data)
        } catch (err: any) {
            const data = err.response?.data

            if (data?.code === 'VALIDATION_ERROR') {
                setFieldErrors(data.errors)
            }
            setError(data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.')
            setStep('idle')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border p-4">
            <Field className="gap-2">
                <FieldLabel htmlFor="lesson-title">Lesson title</FieldLabel>
                <Input
                    id="lesson-title"
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
                <FieldLabel htmlFor="lesson-description">Description (optional)</FieldLabel>
                <Textarea
                    id="lesson-description"
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </Field>

            <Field className="gap-2">
                <FieldLabel>Type</FieldLabel>
                <div className="flex flex-wrap gap-2">
                    {contentTypes.map((option) => (
                        <Button
                            key={option.value}
                            aria-pressed={contentType === option.value}
                            disabled={isBusy}
                            onClick={() => chooseContentType(option.value)}
                            size="sm"
                            type="button"
                            variant={contentType === option.value ? 'default' : 'outline'}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </Field>

            <Field className="gap-2">
                <FieldLabel>Who can watch it</FieldLabel>
                <div className="flex flex-wrap gap-2">
                    <Button
                        aria-pressed={!isPreview}
                        disabled={isBusy}
                        onClick={() => setIsPreview(false)}
                        size="sm"
                        type="button"
                        variant={!isPreview ? 'default' : 'outline'}
                    >
                        Enrolled learners only
                    </Button>
                    <Button
                        aria-pressed={isPreview}
                        disabled={isBusy}
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
                <FieldLabel htmlFor="lesson-file">File</FieldLabel>
                <Input
                    key={contentType}
                    accept={selectedType.accept}
                    disabled={isBusy}
                    id="lesson-file"
                    required
                    type="file"
                    aria-invalid={Boolean(fieldErrors.file)}
                    onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null)
                        clearFieldError('file')
                    }}
                />
                <FieldDescription>Up to {selectedType.maxMb} MB.</FieldDescription>
                <FieldError>{fieldErrors.file?.[0]}</FieldError>
            </Field>

            {contentType !== 'video' && (
                <Field className="gap-2">
                    <FieldLabel htmlFor="lesson-minutes">Estimated reading time (minutes)</FieldLabel>
                    <Input
                        id="lesson-minutes"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        type="number"
                        value={minutes}
                        onChange={(event) => setMinutes(event.target.value)}
                    />
                </Field>
            )}

            {step === 'uploading' && (
                <div className="space-y-1">
                    <div
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={progress}
                        className="h-2 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                    >
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-muted-foreground text-xs">{progress}% uploaded</p>
                </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end gap-3">
                <Button disabled={isBusy} onClick={onCancel} type="button" variant="ghost">
                    Cancel
                </Button>
                <Button disabled={!canSubmit} type="submit">
                    {stepLabel[step]}
                </Button>
            </div>
        </form>
    )
}

export default AddLessonForm