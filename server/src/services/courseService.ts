import mongoose from "mongoose";
import { Course } from "../models/Course";
import { Lesson } from "../models/Lesson";
import { User } from "../models/User";
import { CreateCourseDTO, GetCoursesQuery, UpdateCourseDTO } from "../types/course";
import { LoggerUtils } from "../utils/loggerUtils";
import { removeFileIfUnused } from "./mediaCleanupService";

function isCourseInstructor(instructors: mongoose.Types.ObjectId[], userId: string) {
    return instructors.some((id) => id.toString() === userId);
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class CourseService {
    static async getAllCourses(query: GetCoursesQuery = {}) {
        const filter: Record<string, any> = { status: 'published' }

        if (query.tag) filter.tags = query.tag;
        if (query.category) filter.category = query.category;
        if (query.isFree !== undefined) filter.isFree = query.isFree;
        if (query.level) filter.level = query.level;

        if (query.q) {
            const term = String(query.q).trim().slice(0, 60);

            if (term) {
                const pattern = new RegExp(escapeRegex(term), 'i');
                filter.$or = [
                    { title: pattern },
                    { description: pattern },
                    { tags: pattern },
                    { level: pattern }
                ];
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
            .populate('instructors', 'firstName lastName')
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

        const isFree = data.isFree ?? (data.price ?? 0) === 0;
        const price = isFree ? 0 : (data.price ?? 0);

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
            isFree,
            thumbnailUrl: data.thumbnailUrl,
            thumbnailPublicId: data.thumbnailPublicId,
        });

        const savedCourse = await course.save();

        await User.updateOne(
            { _id: creatorId },
            { $addToSet: { createdCourses: savedCourse._id } }
        );

        return {
            success: true,
            message: "Course created as a draft.",
            code: "COURSE_CREATED",
            data: savedCourse.toObject(),
        };
    }

    static async getMyCourses(userId: string) {
        const courses = await Course.find({ instructors: userId })
            .select('title slug status price currency isFree thumbnailUrl enrollmentCount lessons updatedAt publishedAt')
            .sort({ updatedAt: -1 })
            .lean();

        return {
            success: true,
            message: "Your courses.",
            code: "MY_COURSES_FOUND",
            data: {
                courses: courses.map(({ lessons, ...course }) => ({ ...course, lessonCount: lessons.length })),
            },
        };
    }

    static async getCourseForEditing(courseId: string, userId: string) {
        if (!mongoose.isValidObjectId(courseId)) {
            return { success: false, message: "Invalid course id.", code: "INVALID_COURSE_ID" };
        }

        const course = await Course.findById(courseId).lean();
        if (!course) {
            return { success: false, message: "Course not found.", code: "COURSE_NOT_FOUND" };
        }
        if (!isCourseInstructor(course.instructors, userId)) {
            return { success: false, message: "You can only manage your own courses.", code: "FORBIDDEN" };
        }

        const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 }).lean();

        return {
            success: true,
            message: "Course retrieved for editing.",
            code: "COURSE_FOUND",
            data: { course, lessons },
        };
    }

    static async updateCourse(courseId: string, userId: string, updates: UpdateCourseDTO) {
        if (!mongoose.isValidObjectId(courseId)) {
            return { success: false, message: "Invalid course id.", code: "INVALID_COURSE_ID" };
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return { success: false, message: "Course not found.", code: "COURSE_NOT_FOUND" };
        }
        if (!isCourseInstructor(course.instructors, userId)) {
            return { success: false, message: "You can only manage your own courses.", code: "FORBIDDEN" };
        }

        const previousThumbnail = course.thumbnailPublicId;

        const { status, ...details } = updates;
        Object.assign(course, details);

        if (updates.thumbnailUrl === '') {
            course.thumbnailPublicId = '';
        }

        if (updates.price !== undefined && updates.isFree === undefined) {
            course.isFree = updates.price === 0;
        }
        if (course.isFree) {
            course.price = 0;
        }
        if (!course.isFree && course.price <= 0) {
            return {
                success: false,
                message: "A paid course must have a price greater than zero.",
                code: "INVALID_COURSE_PRICE",
            };
        }

        if (status === 'published' && course.lessons.length === 0) {
            return {
                success: false,
                message: "Add at least one lesson before publishing.",
                code: "COURSE_HAS_NO_LESSONS",
            };
        }
        if (status === 'published' && !course.publishedAt) {
            course.publishedAt = new Date();
        }
        if (status) {
            course.status = status;
        }

        await course.save();

        if (previousThumbnail && previousThumbnail !== course.thumbnailPublicId) {
            removeFileIfUnused(previousThumbnail, 'image', 'upload').catch((error) => {
                LoggerUtils.error('Failed to remove old course thumbnail', { error: String(error) });
            });
        }

        return {
            success: true,
            message: "Course updated.",
            code: "COURSE_UPDATED",
            data: course.toObject(),
        };
    }
}