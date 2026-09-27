import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Button render={<Link to="/" />} nativeButton={false}>
        Back to courses
      </Button>
    </div>
  )
}

export default NotFoundPage