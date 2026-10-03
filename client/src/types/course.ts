export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export type Course = {
  _id: string
  title: string
  slug: string
  description: string
  price: number        // minor units (kobo), per the backend model
  currency: string
  isFree: boolean
  level: CourseLevel
  thumbnailUrl?: string
  tags?: string[]
  enrollmentCount?: number
  totalDurationSeconds?: number
}

export type Instructor = {
  _id: string
  firstName?: string
  lastName?: string
}

export type CourseDetail = Course & {
  instructors?: Instructor[]
  category?: string
  language?: string
  createdAt?: string
}

export type LessonContentType = 'video' | 'pdf' | 'slides' | 'quiz'

export type Lesson = {
  _id: string
  title: string
  description?: string
  order: number
  contentType: LessonContentType
  isPreview: boolean
  durationSeconds: number
}