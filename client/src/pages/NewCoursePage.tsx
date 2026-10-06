import { Link, useNavigate } from 'react-router-dom'
import CourseForm, { type CoursePayload } from '@/components/CourseForm'
import { api } from '@/lib/apiClient'

function NewCoursePage() {
  const navigate = useNavigate()

  async function createCourse(payload: CoursePayload) {
    const response = await api.post('/courses', payload)
    navigate(`/teach/courses/${response.data.data._id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link className="text-muted-foreground text-sm underline underline-offset-4" to="/teach">
          ← My courses
        </Link>
        <h1 className="font-bold text-3xl">New course</h1>
        <p className="text-muted-foreground text-sm">
          It starts as a draft. Only you can see it until you publish it.
        </p>
      </div>

      <CourseForm onSubmit={createCourse} submitLabel="Create draft" submittingLabel="Creating…" />
    </div>
  )
}

export default NewCoursePage