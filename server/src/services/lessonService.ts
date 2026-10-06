import { Lesson, ILesson } from '../models/Lesson';
import { Course } from '../models/Course';
import { resolveMediaUrl } from './mediaService';
import { resourceTypeFor } from './fileUploadService';
import { removeFileIfUnused } from './mediaCleanupService';
import { LoggerUtils } from '../utils/loggerUtils';
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
            return {
                fail: {
                    success: false,
                    message: 'You do not have permission to modify this course.',
                    code: 'FORBIDDEN'
                }
            };
        }
        return { fail: null };
    }

    private static validateContent(contentType: string, data: Partial<CreateLessonDTO>): string | null {
        switch (contentType) {
            case 'video': return data.video?.url ? null : 'MISSING_VIDEO_URL';
            case 'pdf': return data.pdf?.url ? null : 'MISSING_PDF_URL';
            case 'slides': return data.slides?.url ? null : 'MISSING_SLIDES_URL';
            case 'quiz': return data.quiz ? null : 'MISSING_QUIZ_REF';
            default: return 'INVALID_CONTENT_TYPE';
        }
    }

    private static async removeMediaFile(lesson: ILesson) {
        const block =
            lesson.contentType === 'video' ? lesson.video :
                lesson.contentType === 'pdf' ? lesson.pdf :
                    lesson.contentType === 'slides' ? lesson.slides :
                        undefined;

        if (!block?.publicId) return;

        await removeFileIfUnused(block.publicId, resourceTypeFor(lesson.contentType), lesson.deliveryType ?? 'upload');
    }

    static async createLesson(data: CreateLessonDTO) {
        const { courseId, creatorId, title, contentType } = data;

        const ownership = await this.checkCourseOwnership(courseId, creatorId);
        if (ownership.fail) return ownership.fail;

        const contentError = this.validateContent(contentType, data);
        if (contentError) {
            return { success: false, message: 'Missing required content for this lesson type.', code: contentError };
        }

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
            deliveryType: data.deliveryType ?? 'upload',
            durationSeconds,
            video: data.video,
            pdf: data.pdf,
            slides: data.slides,
            quiz: data.quiz,
        });

        const saved = await lesson.save();

        await Course.updateOne(
            { _id: courseId },
            {
                $push: { lessons: saved._id },
                $inc: { totalDurationSeconds: durationSeconds },
            },
        );

        return {
            success: true,
            message: 'Lesson created successfully.',
            code: 'LESSON_CREATED',
            data: saved.toObject()
        };
    }

    static async getLessonsByCourse(courseId: string, canSeeAll = false) {
        if (!courseId) {
            return { success: false, message: 'Invalid course id.', code: 'INVALID_COURSE_ID' };
        }

        const filter: Record<string, any> = { course: courseId };
        if (!canSeeAll) filter.isPreview = true;

        const lessons = await Lesson.find(filter).sort({ order: 1 }).lean();

        return {
            success: true,
            message: 'Lessons retrieved successfully.',
            code: 'LESSONS_FOUND',
            data: { lessons, previewOnly: !canSeeAll },
        };
    }

    static async getLessonById(lessonId: string, canSeeAll = false) {
        const lesson = await Lesson.findById(lessonId).lean();

        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }
        if (!canSeeAll && !lesson.isPreview) {
            return { success: false, message: 'Enroll in this course to access this lesson.', code: 'ENROLLMENT_REQUIRED' };
        }

        const media = resolveMediaUrl(lesson);

        if (!media.success) {
            if (media.code === 'NO_MEDIA_FOR_TYPE') {
                return { success: true, message: 'Lesson retrieved.', code: 'LESSON_FOUND', data: lesson };
            }

            return { success: false, message: 'This lesson\'s content is currently unavailable.', code: 'MEDIA_UNAVAILABLE' };
        }

        return {
            success: true,
            message: 'Lesson retrieved successfully.',
            code: 'LESSON_FOUND',
            data: { ...lesson, deliverableUrl: media.url }
        };
    }

    static async updateLesson(lessonId: string, userId: string, updates: UpdateLessonDTO) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        const ownership = await this.checkCourseOwnership(lesson.course.toString(), userId);
        if (ownership.fail) return ownership.fail;

        const oldDuration = lesson.durationSeconds;
        Object.assign(lesson, updates);
        const saved = await lesson.save();
        const delta = saved.durationSeconds - oldDuration;

        if (delta !== 0) {
            await Course.updateOne({ _id: lesson.course }, { $inc: { totalDurationSeconds: delta } });
        }

        return {
            success: true,
            message: 'Lesson updated successfully.',
            code: 'LESSON_UPDATED',
            data: saved.toObject()
        };
    }

    static async deleteLesson(lessonId: string, userId: string) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        const ownership = await this.checkCourseOwnership(lesson.course.toString(), userId);
        if (ownership.fail) return ownership.fail;

        await lesson.deleteOne();

        await Course.updateOne(
            { _id: lesson.course },
            {
                $pull: { lessons: lesson._id },
                $inc: { totalDurationSeconds: -lesson.durationSeconds },
            },
        );

        await Lesson.updateMany(
            { course: lesson.course, order: { $gt: lesson.order } },
            { $inc: { order: -1 } },
        );

        this.removeMediaFile(lesson).catch((error) => {
            LoggerUtils.error('Failed to remove lesson media from Cloudinary', { error: String(error) });
        });

        return {
            success: true,
            message: 'Lesson deleted successfully.',
            code: 'LESSON_DELETED'
        };
    }

    static async moveLesson(lessonId: string, userId: string, direction: 'up' | 'down') {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        const ownership = await this.checkCourseOwnership(lesson.course.toString(), userId);
        if (ownership.fail) return ownership.fail;

        const neighbour = await Lesson.findOne({
            course: lesson.course,
            order: direction === 'up' ? { $lt: lesson.order } : { $gt: lesson.order },
        }).sort({ order: direction === 'up' ? -1 : 1 });

        if (!neighbour) {
            return {
                success: false,
                message: direction === 'up' ? 'This lesson is already first.' : 'This lesson is already last.',
                code: 'LESSON_AT_EDGE',
            };
        }

        await Lesson.bulkWrite([
            { updateOne: { filter: { _id: lesson._id }, update: { $set: { order: neighbour.order } } } },
            { updateOne: { filter: { _id: neighbour._id }, update: { $set: { order: lesson.order } } } },
        ]);

        const lessons = await Lesson.find({ course: lesson.course }).sort({ order: 1 }).lean();

        return {
            success: true,
            message: 'Lesson moved.',
            code: 'LESSON_MOVED',
            data: { lessons },
        };
    }
}