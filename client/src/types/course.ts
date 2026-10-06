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

export type EnrolledCourse = {
  _id: string
  title: string
  slug: string
  thumbnailUrl?: string
  level: CourseLevel
  price: number
  currency: string
  isFree: boolean
}

export type MyEnrollment = {
  _id: string
  course: EnrolledCourse
  completionPercentage: number
  enrolledAt: string
}

export type LessonProgress = {
  lesson: string
  completed: boolean
  completedAt?: string
}

export type Enrollment = {
  _id: string
  course: string
  completionPercentage: number
  enrolledAt: string
  lessonProgress: LessonProgress[]
  completedAt?: string
}

export type CourseStatus = 'draft' | 'published' | 'unpublished'

export type InstructorCourse = {
  _id: string
  title: string
  slug: string
  status: CourseStatus
  price: number
  currency: string
  isFree: boolean
  thumbnailUrl?: string
  enrollmentCount: number
  lessonCount: number
  updatedAt: string
  publishedAt?: string
}

export type ManagedCourse = Course & {
  status: CourseStatus
  category?: string
  publishedAt?: string
  thumbnailPublicId?: string
}