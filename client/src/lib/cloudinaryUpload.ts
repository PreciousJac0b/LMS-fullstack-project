import axios from 'axios'
import { api } from '@/lib/apiClient'

export type UploadKind = 'video' | 'pdf' | 'slides' | 'thumbnail'

type UploadSignature = {
  signature: string
  timestamp: number
  folder: string
  type: string
  apiKey: string
  cloudName: string
  resourceType: string
}

export type UploadedFile = {
  secure_url: string
  public_id: string
  duration?: number
}

type UploadOptions = {
  kind: UploadKind
  isPublic: boolean
  onProgress?: (percent: number) => void
}

export async function uploadToCloudinary(file: File, { kind, isPublic, onProgress }: UploadOptions) {
  const signatureResponse = await api.get('/courses/upload-signature', {
    params: { contentType: kind, access: isPublic ? 'public' : 'private' },
  })
  const signed: UploadSignature = signatureResponse.data.data

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signed.apiKey)
  formData.append('timestamp', String(signed.timestamp))
  formData.append('folder', signed.folder)
  formData.append('type', signed.type)
  formData.append('signature', signed.signature)

  const uploadResponse = await axios.post<UploadedFile>(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
    formData,
    {
      onUploadProgress: (progressEvent) => {
        const total = progressEvent.total ?? file.size
        onProgress?.(Math.round((progressEvent.loaded / total) * 100))
      },
    },
  )

  return uploadResponse.data
}