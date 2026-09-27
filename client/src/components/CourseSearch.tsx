import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'


function CourseSearch() {
    const [query, setQuery] = useState('')

    return (
        <div className="space-y-2">
            <Label htmlFor="course-search">Search courses</Label>

            <div className="flex gap-2">
                <Input
                    id="course-search"
                    placeholder="e.g. javascript"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <Button onClick={() => setQuery('')}>Clear</Button>
            </div>

            <p className="text-sm text-muted-foreground">
                {query === '' ? 'Type to search.' : `Searching for: ${query}`}
            </p>
        </div>
    )
}

export default CourseSearch