import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { uploadToCloudinary } from '@/lib/cloudinaryUpload'

const MAX_MB = 5

export type Thumbnail = {
    url: string
    publicId: string
}

type ThumbnailFieldProps = {
    value: string
    onChange: (thumbnail: Thumbnail) => void
    onUploadingChange: (isUploading: boolean) => void
}

function ThumbnailField({ value, onChange, onUploadingChange }: ThumbnailFieldProps) {
    const [progress, setProgress] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [inputKey, setInputKey] = useState(0)

    async function handleFile(file: File | undefined) {
        if (!file) return
        setError('')

        if (file.size > MAX_MB * 1024 * 1024) {
            setError(`This image is too large. The limit is ${MAX_MB} MB.`)
            setInputKey(inputKey + 1)
            return
        }

        setProgress(0)
        onUploadingChange(true)

        try {
            const uploaded = await uploadToCloudinary(file, {
                kind: 'thumbnail',
                isPublic: true,
                onProgress: setProgress,
            })
            onChange({ url: uploaded.secure_url, publicId: uploaded.public_id })
        } catch (err: any) {
            const data = err.response?.data
            setError(data?.error?.message ?? data?.message ?? 'Could not upload the image.')
        } finally {
            setProgress(null)
            onUploadingChange(false)
            setInputKey(inputKey + 1)
        }
    }

    return (
        <Field className="gap-2">
            <FieldLabel htmlFor="thumbnail">Thumbnail (optional)</FieldLabel>

            {value && (
                <div className="flex items-end gap-3">
                    <img
                        alt="Course thumbnail"
                        className="aspect-video w-48 rounded-lg border border-border object-cover"
                        src={value}
                    />
                    <Button
                        disabled={progress !== null}
                        onClick={() => onChange({ url: '', publicId: '' })}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        Remove
                    </Button>
                </div>
            )}

            <Input
                key={inputKey}
                accept="image/*"
                disabled={progress !== null}
                id="thumbnail"
                type="file"
                onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {progress !== null ? (
                <div
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progress}
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                >
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
            ) : (
                <FieldDescription>
                    {value ? 'Choose a new image to replace it.' : `A 16:9 image works best. Up to ${MAX_MB} MB.`}
                </FieldDescription>
            )}

            <FieldError>{error}</FieldError>
        </Field>
    )
}

export default ThumbnailField