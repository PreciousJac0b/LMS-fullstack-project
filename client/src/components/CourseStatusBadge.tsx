import { Badge } from '@/components/ui/badge'
import type { CourseStatus } from '@/types/course'

const statusBadge: Record<CourseStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  published: { label: 'Published', variant: 'default' },
  draft: { label: 'Draft', variant: 'secondary' },
  unpublished: { label: 'Unpublished', variant: 'outline' },
}

type CourseStatusBadgeProps = {
  status: CourseStatus
}

function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  return <Badge variant={statusBadge[status].variant}>{statusBadge[status].label}</Badge>
}

export default CourseStatusBadge