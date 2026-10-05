import type { Course } from "@/types/course"

export function formatPrice(course: Course) {
  if (course.isFree || course.price <= 0) {
    return 'Free'
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: course.currency || 'NGN',
    maximumFractionDigits: 0,
  }).format(course.price / 100)
}