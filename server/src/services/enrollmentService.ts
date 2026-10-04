import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';

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
}