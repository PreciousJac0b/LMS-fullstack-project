import { Lesson } from '../models/Lesson';
import { Course } from '../models/Course';
import { CreateLessonDTO, UpdateLessonDTO } from '../types/lesson';

export class LessonService {
    private static async checkCourseOwnership(courseId: string, userId: string) {
        const course = await Course.findById(courseId).select('instructors').lean();

        if (!course) {
            return { fail: { success: false, message: 'Course not found.', code: 'COURSE_NOT_FOUND' } };
        }
        const isInstructor = course.instructors.some(
            (id: any) => id.toString() === userId.toString(),
        );
        if (!isInstructor) {
            return { fail: { success: false, message: 'You do not have permission to modify this course.', code: 'FORBIDDEN' } };
        }
        return { fail: null };
    }

    private static validateContent(contentType: string, data: Partial<CreateLessonDTO>): string | null {
        switch (contentType) {
            case 'video':  return data.video?.url  ? null : 'MISSING_VIDEO_URL';
            case 'pdf':    return data.pdf?.url    ? null : 'MISSING_PDF_URL';
            case 'slides': return data.slides?.url ? null : 'MISSING_SLIDES_URL';
            case 'quiz':   return data.quiz        ? null : 'MISSING_QUIZ_REF';
            default:       return 'INVALID_CONTENT_TYPE';
        }
    }

    static async createLesson(data: CreateLessonDTO) {
        const { courseId, creatorId, title, contentType } = data;

        if (!title || !contentType) {
            return { success: false, message: 'Title and content type are required.', code: 'INVALID_LESSON_INPUT' };
        }

        const ownership = await this.checkCourseOwnership(courseId, creatorId);
        if (ownership.fail) return ownership.fail;

        const contentError = this.validateContent(contentType, data);
        if (contentError) {
            return { success: false, message: 'Missing required content for this lesson type.', code: contentError };
        }

        // Auto-assign order = (highest existing order in this course) + 1, unless given
        let order = data.order;
        if (order === undefined) {
            const last = await Lesson.findOne({ course: courseId }).sort({ order: -1 }).select('order').lean();
            order = (last?.order ?? 0) + 1;
        }

        const durationSeconds = data.durationSeconds ?? 0;

        const lesson = new Lesson({
            course: courseId,
            title,
            description: data.description,
            order,
            contentType,
            isPreview: data.isPreview ?? false,
            durationSeconds,
            video: data.video,
            pdf: data.pdf,
            slides: data.slides,
            quiz: data.quiz,
        });

        const saved = await lesson.save();

        // Keep the parent course in sync: add to lessons[] and roll up duration
        await Course.updateOne(
            { _id: courseId },
            {
                $push: { lessons: saved._id },
                $inc: { totalDurationSeconds: durationSeconds },
            },
        );

        return { success: true, message: 'Lesson created successfully.', code: 'LESSON_CREATED', data: saved.toObject() };
    }

    static async getLessonsByCourse(courseId: string, isEnrolled = false) {
        if (!courseId) {
            return { success: false, message: 'Invalid course id.', code: 'INVALID_COURSE_ID' };
        }

        // Non-enrolled viewers only get preview lessons (Req 3 gating)
        const filter: Record<string, any> = { course: courseId };
        if (!isEnrolled) filter.isPreview = true;

        const lessons = await Lesson.find(filter).sort({ order: 1 }).lean();

        return {
            success: true,
            message: 'Lessons retrieved successfully.',
            code: 'LESSONS_FOUND',
            data: { lessons, previewOnly: !isEnrolled },
        };
    }

    static async getLessonById(lessonId: string, isEnrolled = false) {
        const lesson = await Lesson.findById(lessonId).lean();

        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }
        // Block full content for non-enrolled users unless it's a preview lesson
        if (!isEnrolled && !lesson.isPreview) {
            return { success: false, message: 'Enroll in this course to access this lesson.', code: 'ENROLLMENT_REQUIRED' };
        }

        return { success: true, message: 'Lesson retrieved successfully.', code: 'LESSON_FOUND', data: lesson };
    }

    static async updateLesson(lessonId: string, userId: string, updates: UpdateLessonDTO) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        // Ownership is checked via the lesson's parent course
        const ownership = await this.checkCourseOwnership(lesson.course.toString(), userId);
        if (ownership.fail) return ownership.fail;

        // If content type changes, re-validate the required content exists
        const nextType = updates.contentType ?? lesson.contentType;
        const contentError = this.validateContent(nextType, { ...lesson.toObject(), ...updates });
        if (contentError) {
            return { success: false, message: 'Missing required content for this lesson type.', code: contentError };
        }

        // Track a duration delta so the course total stays correct
        const oldDuration = lesson.durationSeconds;
        Object.assign(lesson, updates);
        const saved = await lesson.save();
        const delta = saved.durationSeconds - oldDuration;

        if (delta !== 0) {
            await Course.updateOne({ _id: lesson.course }, { $inc: { totalDurationSeconds: delta } });
        }

        return { success: true, message: 'Lesson updated successfully.', code: 'LESSON_UPDATED', data: saved.toObject() };
    }

    static async deleteLesson(lessonId: string, userId: string) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        const ownership = await this.checkCourseOwnership(lesson.course.toString(), userId);
        if (ownership.fail) return ownership.fail;

        await lesson.deleteOne();

        // Reverse the sync: remove from lessons[] and subtract its duration
        await Course.updateOne(
            { _id: lesson.course },
            {
                $pull: { lessons: lesson._id },
                $inc: { totalDurationSeconds: -lesson.durationSeconds },
            },
        );

        return { success: true, message: 'Lesson deleted successfully.', code: 'LESSON_DELETED' };
    }
}