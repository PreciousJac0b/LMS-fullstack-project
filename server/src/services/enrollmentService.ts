import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { Lesson } from '../models/Lesson';

export class EnrollmentService {
    static async enrollFree(userId: string, courseId: string) {
        if (!mongoose.isValidObjectId(courseId)) {
            return { success: false, message: 'Invalid course id.', code: 'INVALID_COURSE_ID' };
        }

        const course = await Course.findOne({ _id: courseId, status: 'published' }).lean();
        if (!course) {
            return { success: false, message: 'Course not found.', code: 'COURSE_NOT_FOUND' };
        }

        if (!course.isFree && course.price > 0) {
            return {
                success: false,
                message: 'This course requires payment.',
                code: 'PAYMENT_REQUIRED',
            };
        }

        const result = await Enrollment.updateOne(
            { user: userId, course: courseId },
            { $setOnInsert: { user: userId, course: courseId } },
            { upsert: true },
        );

        if (result.upsertedCount > 0) {
            await Course.updateOne({ _id: courseId }, { $inc: { enrollmentCount: 1 } });
        }

        const enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();

        return {
            success: true,
            message: result.upsertedCount > 0 ? 'Enrolled successfully.' : 'You are already enrolled.',
            code: result.upsertedCount > 0 ? 'ENROLLED' : 'ALREADY_ENROLLED',
            data: enrollment,
        };
    }

    static async getMyEnrollments(userId: string) {
        const enrollments = await Enrollment.find({ user: userId })
            .populate('course', 'title slug thumbnailUrl level price currency isFree')
            .sort({ createdAt: -1 })
            .lean();

        return {
            success: true,
            message: 'Enrollments retrieved.',
            code: 'ENROLLMENTS_FOUND',
            data: { enrollments },
        };
    }

    static async getEnrollmentForCourse(userId: string, courseId: string) {
        if (!mongoose.isValidObjectId(courseId)) {
            return { success: false, message: 'Invalid course id.', code: 'INVALID_COURSE_ID' };
        }

        const enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();

        return {
            success: true,
            message: 'Enrollment status retrieved.',
            code: 'ENROLLMENT_STATUS',
            data: { isEnrolled: !!enrollment, enrollment: enrollment ?? null },
        };
    }

    static async updateLessonProgress(userId: string, lessonId: string, completed: unknown) {
        if (!mongoose.isValidObjectId(lessonId)) {
            return { success: false, message: 'Invalid lesson id.', code: 'INVALID_LESSON_ID' };
        }
        if (typeof completed !== 'boolean') {
            return { success: false, message: '"completed" must be true or false.', code: 'INVALID_PROGRESS_INPUT' };
        }

        const lesson = await Lesson.findById(lessonId).select('course').lean();
        if (!lesson) {
            return { success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' };
        }

        const enrollment = await Enrollment.findOne({ user: userId, course: lesson.course });
        if (!enrollment) {
            return { success: false, message: 'Enrol in this course to track your progress.', code: 'NOT_ENROLLED' };
        }

        const entry = enrollment.lessonProgress.find((p) => p.lesson.toString() === lessonId);

        if (entry) {
            entry.completed = completed;
            entry.completedAt = completed ? (entry.completedAt ?? new Date()) : undefined;
        } else {
            enrollment.lessonProgress.push({
                lesson: new mongoose.Types.ObjectId(lessonId),
                completed,
                completedAt: completed ? new Date() : undefined,
            });
        }

        const courseLessons = await Lesson.find({ course: lesson.course }).select('_id').lean();
        const liveIds = new Set(courseLessons.map((l) => String(l._id)));

        const doneCount = enrollment.lessonProgress.filter(
            (p) => p.completed && liveIds.has(p.lesson.toString()),
        ).length;

        enrollment.completionPercentage =
            liveIds.size === 0 ? 0 : Math.floor((doneCount / liveIds.size) * 100);

        enrollment.completedAt =
            enrollment.completionPercentage === 100
                ? (enrollment.completedAt ?? new Date())
                : undefined;

        await enrollment.save();

        return {
            success: true,
            message: completed ? 'Lesson marked as complete.' : 'Lesson marked as not complete.',
            code: 'PROGRESS_UPDATED',
            data: { enrollment: enrollment.toObject() },
        };
    }
}