import { Course } from "../models/Course";
import { User } from "../models/User";
import { CreateCourseDTO, GetCoursesQuery } from "../types/course";

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
            code: 'COURSE_FOUND',
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

    static async getCourseBySlug(slug: string) {
        if (!slug) {
            return {
                success: false,
                message: "Invalid slug provided.",
                code: "INVALID_SLUG"
            }
        }


        const course = await Course.findOne({ slug, status: "published" })
            .populate('instructor', 'firstName lastName')
            .lean();

        if (!course) {
            return {
                success: false,
                message: "Course not found.",
                code: "COURSE_NOT_FOUND"
            }
        }

        return {
            success: true,
            message: "Successfully retrieved courses",
            code: "COURSE_FOUND",
            data: course
        }
    }

    static async createCourse(data: CreateCourseDTO) {
        const { title, description, creatorId } = data;

        if (!title || !description) {
            return {
                success: false,
                message: "Title and description are required.",
                code: "INVALID_COURSE_INPUT",
            }
        }

        const isFree = data.isFree ?? (data.price ?? 0) === 0;
        const price = isFree ? 0 : (data.price ?? 0)

        if (!isFree && price <= 0) {
            return {
                success: false,
                message: "A paid course must have a price greater than zero.",
                code: "INVALID_COURSE_PRICE"
            }
        }

        const course = new Course({
            title,
            description,
            instructors: [creatorId],
            tags: data.tags ?? [],
            category: data.category,
            level: data.level ?? 'beginner',
            language: data.language ?? 'en',
            price,
            currency: data.currency ?? 'NGN',
            isFree,
            thumbnailUrl: data.thumbnailUrl,
        });

        const savedCourse = await course.save();

        await User.updateOne(
            { _id: creatorId },
            { $addToSet: { createdCourses: savedCourse._id } }
        );

        return {
            success: true,
            message: "Course created successfully.",
            code: "COURSE_CREATED",
            data: savedCourse.toObject(),
        };

    }
}