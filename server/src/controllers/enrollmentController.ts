import { Request, Response } from 'express';
import { EnrollmentService } from '../services/enrollmentService';

const statusForCode: Record<string, number> = {
    ENROLLED: 201,
    ALREADY_ENROLLED: 200,
    ENROLLMENTS_FOUND: 200,
    ENROLLMENT_STATUS: 200,
    INVALID_COURSE_ID: 400,
    COURSE_NOT_FOUND: 404,
    PAYMENT_REQUIRED: 402,
    PROGRESS_UPDATED: 200,
    INVALID_LESSON_ID: 400,
    INVALID_PROGRESS_INPUT: 400,
    LESSON_NOT_FOUND: 404,
    NOT_ENROLLED: 403,
};

export class EnrollmentController {
    static async enrollFree(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { courseId } = req.params as { courseId: string };

            const result = await EnrollmentService.enrollFree(userId, courseId);
            res.status(statusForCode[result.code ?? ''] ?? (result.success ? 200 : 400)).json(result);
        } catch (err) {
            console.error('enrollFree error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getMyEnrollments(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const result = await EnrollmentService.getMyEnrollments(userId);
            res.status(statusForCode[result.code ?? ''] ?? 200).json(result);
        } catch (err) {
            console.error('getMyEnrollments error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getEnrollmentForCourse(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { courseId } = req.params as { courseId: string };

            const result = await EnrollmentService.getEnrollmentForCourse(userId, courseId);
            res.status(statusForCode[result.code ?? ''] ?? (result.success ? 200 : 400)).json(result);
        } catch (err) {
            console.error('getEnrollmentForCourse error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async updateLessonProgress(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { lessonId } = req.params as { lessonId: string };
            const completed = req.body?.completed;

            const result = await EnrollmentService.updateLessonProgress(userId, lessonId, completed);
            res.status(statusForCode[result.code ?? ''] ?? (result.success ? 200 : 400)).json(result);
        } catch (err) {
            console.error('updateLessonProgress error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}