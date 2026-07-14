import { Course } from "../models/Course";
import { GetCoursesQuery } from "../types/course";

export class CourseService {
    static async getAllCourses(query: GetCoursesQuery = {}) {
        const filter: Record<string, any> = { status: 'published' }

        if (query.tag) filter.tags = query.tag;
        if (query.category) filter.category = query.category;
        if (query.isFree !== undefined) filter.isFree = query.isFree;

        if (query.q) {
            filter.$text = {
                $search: query.q,
            }
        }

        const pageNumber = Math.max(1, Number(query.page ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(query.limit ?? 10)));

        const [courses, totalCourses] = await Promise.all([Course.find(filter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean(),
        Course.countDocuments(filter)]);

        if (!courses || !Array.isArray(courses)) {
            return {
                success: false,
                message: "Failed to retrieve courses."
            }
        }

        const totalPages = Math.ceil(totalCourses / pageSize)

        return {
            success: true,
            message: "Successfuly retrieved courses.",
            code: 'COURSES_FETCHED',
            data: {
                courses,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    totalCourses,
                    totalPages
                }
            }
        }
    }
}