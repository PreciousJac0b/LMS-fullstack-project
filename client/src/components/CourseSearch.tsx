import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CourseSearchProps = {
    value: string
    onChange: (value: string) => void
}

function CourseSearch({ value, onChange }: CourseSearchProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="course-search">Search courses</Label>
            <Input
                id="course-search"
                placeholder="e.g. javascript, 'beginner', Machine Learning"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    )
}

export default CourseSearch