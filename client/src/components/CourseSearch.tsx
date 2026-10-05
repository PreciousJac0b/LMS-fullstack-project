import { Input } from '@/components/ui/input'

type CourseSearchProps = {
  value: string
  onChange: (value: string) => void
}

function CourseSearch({ value, onChange }: CourseSearchProps) {
  return (
    <div className="relative max-w-md">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
      </svg>

      <Input
        aria-label="Search courses"
        className="pl-9"
        id="course-search"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search courses"
        type="search"
        value={value}
      />
    </div>
  )
}

export default CourseSearch