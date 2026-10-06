import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import ThumbnailField, { type Thumbnail } from '@/components/ThumbnailField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFieldErrors } from '@/hooks/useFieldErrors'
import type { CourseLevel } from '@/types/course'

export type CoursePayload = {
    title: string
    description: string
    level: CourseLevel
    category: string
    tags: string[]
    isFree: boolean
    price: number
    thumbnailUrl: string
    thumbnailPublicId: string
}

type CourseFormProps = {
    initialValues?: Partial<CoursePayload>
    submitLabel: string
    submittingLabel: string
    onSubmit: (payload: CoursePayload) => Promise<void>
}

const levels: { value: CourseLevel; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
]

type Pricing = 'free' | 'paid'

function CourseForm({ initialValues = {}, submitLabel, submittingLabel, onSubmit }: CourseFormProps) {
    const [title, setTitle] = useState(initialValues.title ?? '')
    const [description, setDescription] = useState(initialValues.description ?? '')
    const [level, setLevel] = useState<CourseLevel>(initialValues.level ?? 'beginner')
    const [pricing, setPricing] = useState<Pricing>(initialValues.isFree === false ? 'paid' : 'free')
    const [priceNaira, setPriceNaira] = useState(
        initialValues.isFree === false && initialValues.price ? String(initialValues.price / 100) : '',
    )
    const [category, setCategory] = useState(initialValues.category ?? '')
    const [tags, setTags] = useState((initialValues.tags ?? []).join(', '))
    const [thumbnail, setThumbnail] = useState<Thumbnail>({
        url: initialValues.thumbnailUrl ?? '',
        publicId: initialValues.thumbnailPublicId ?? '',
    })
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors()

    const priceIsValid = pricing === 'free' || Number(priceNaira) > 0
    const canSubmit = priceIsValid && !isSubmitting && !isUploadingThumbnail

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setFieldErrors({})
        setIsSubmitting(true)

        try {
            await onSubmit({
                title,
                description,
                level,
                category: category.trim(),
                tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                isFree: pricing === 'free',
                price: pricing === 'paid' ? Math.round(Number(priceNaira) * 100) : 0,
                thumbnailUrl: thumbnail.url,
                thumbnailPublicId: thumbnail.publicId,
            })
        } catch (err: any) {
            const data = err.response?.data

            if (data?.code === 'VALIDATION_ERROR') {
                setFieldErrors(data.errors)
                setError('Please fix the highlighted fields.')
            } else if (data?.code === 'INVALID_COURSE_PRICE') {
                setFieldErrors({ price: [data.message] })
            } else {
                setError(data?.message ?? 'Could not save the course. Please try again.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Field className="gap-2">
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Python for Data Science"
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
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="What will learners be able to do by the end?"
                    required
                    rows={5}
                    value={description}
                    aria-invalid={Boolean(fieldErrors.description)}
                    onChange={(event) => {
                        setDescription(event.target.value)
                        clearFieldError('description')
                    }}
                />
                <FieldDescription>At least 20 characters.</FieldDescription>
                <FieldError>{fieldErrors.description?.[0]}</FieldError>
            </Field>

            <Field className="gap-2">
                <FieldLabel>Level</FieldLabel>
                <div className="flex flex-wrap gap-2">
                    {levels.map((option) => (
                        <Button
                            key={option.value}
                            aria-pressed={level === option.value}
                            onClick={() => setLevel(option.value)}
                            size="sm"
                            type="button"
                            variant={level === option.value ? 'default' : 'outline'}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </Field>

            <Field className="gap-2">
                <FieldLabel>Pricing</FieldLabel>
                <div className="flex flex-wrap gap-2">
                    <Button
                        aria-pressed={pricing === 'free'}
                        onClick={() => {
                            setPricing('free')
                            clearFieldError('price')
                        }}
                        size="sm"
                        type="button"
                        variant={pricing === 'free' ? 'default' : 'outline'}
                    >
                        Free
                    </Button>
                    <Button
                        aria-pressed={pricing === 'paid'}
                        onClick={() => setPricing('paid')}
                        size="sm"
                        type="button"
                        variant={pricing === 'paid' ? 'default' : 'outline'}
                    >
                        Paid
                    </Button>
                </div>
            </Field>

            {pricing === 'paid' && (
                <Field className="gap-2">
                    <FieldLabel htmlFor="price">Price (₦)</FieldLabel>
                    <Input
                        id="price"
                        inputMode="numeric"
                        min={1}
                        name="price"
                        placeholder="5000"
                        required
                        step={1}
                        type="number"
                        value={priceNaira}
                        aria-invalid={Boolean(fieldErrors.price)}
                        onChange={(event) => {
                            setPriceNaira(event.target.value)
                            clearFieldError('price')
                        }}
                    />
                    <FieldError>{fieldErrors.price?.[0]}</FieldError>
                </Field>
            )}

            <Field className="gap-2">
                <FieldLabel htmlFor="category">Category (optional)</FieldLabel>
                <Input
                    id="category"
                    name="category"
                    placeholder="e.g. Data"
                    value={category}
                    aria-invalid={Boolean(fieldErrors.category)}
                    onChange={(event) => {
                        setCategory(event.target.value)
                        clearFieldError('category')
                    }}
                />
                <FieldError>{fieldErrors.category?.[0]}</FieldError>
            </Field>

            <Field className="gap-2">
                <FieldLabel htmlFor="tags">Tags (optional)</FieldLabel>
                <Input
                    id="tags"
                    name="tags"
                    placeholder="python, pandas, statistics"
                    value={tags}
                    aria-invalid={Boolean(fieldErrors.tags)}
                    onChange={(event) => {
                        setTags(event.target.value)
                        clearFieldError('tags')
                    }}
                />
                <FieldDescription>Separate tags with commas. Up to 10.</FieldDescription>
                <FieldError>{fieldErrors.tags?.[0]}</FieldError>
            </Field>

            <ThumbnailField
                value={thumbnail.url}
                onChange={setThumbnail}
                onUploadingChange={setIsUploadingThumbnail}
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end">
                <Button disabled={!canSubmit} type="submit">
                    {isSubmitting ? submittingLabel : submitLabel}
                </Button>
            </div>
        </form>
    )
}

export default CourseForm