import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Course } from '@/types/course'

function formatPrice(course: Course) {
  if (course.isFree || course.price <= 0) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: course.currency || 'NGN',
    maximumFractionDigits: 0,
  }).format(course.price / 100)
}

type CourseCardProps = {
  course: Course
}

function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {course.thumbnailUrl && (
        <img
          src={course.thumbnailUrl}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}

      <CardHeader>
        <CardTitle className="text-base leading-snug">
          <Link to={`/courses/${course.slug}`} className="hover:underline">
            {course.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <Badge variant="secondary">{course.level}</Badge>
        <span className="font-medium text-sm">{formatPrice(course)}</span>
      </CardContent>
    </Card>
  )
}

export default CourseCard