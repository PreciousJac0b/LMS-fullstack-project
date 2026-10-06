import { Request, Response } from "express";
import { LessonService } from "../services/lessonService";
import { Lesson } from "../models/Lesson";
import { Enrollment } from "../models/Enrollment";
import { Course } from "../models/Course";

const statusForCode: Record<string, number> = {
    LESSON_FOUND: 200,
    LESSONS_FOUND: 200,
    LESSON_NOT_FOUND: 404,
    INVALID_COURSE_ID: 400,
    ENROLLMENT_REQUIRED: 403,
    MEDIA_UNAVAILABLE: 502,

    LESSON_CREATED: 201,
    LESSON_UPDATED: 200,
    LESSON_DELETED: 200,
    LESSON_MOVED: 200,
    LESSON_AT_EDGE: 400,
    INVALID_LESSON_INPUT: 400,
    INVALID_CONTENT_TYPE: 400,
    MISSING_VIDEO_URL: 400,
    MISSING_PDF_URL: 400,
    MISSING_SLIDES_URL: 400,
    MISSING_QUIZ_REF: 400,

    COURSE_NOT_FOUND: 404,
    FORBIDDEN: 403,
};

async function canSeeAllLessons(userId: string | undefined, courseId: any): Promise<boolean> {
    if (!userId) return false;

    const [isEnrolled, isInstructor] = await Promise.all([
        Enrollment.exists({ user: userId, course: courseId }),
        Course.exists({ _id: courseId, instructors: userId }),
    ]);

    return Boolean(isEnrolled || isInstructor);
}

export class LessonController {

    static async getLessonsByCourse(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            const { courseId } = req.params as { courseId: string };

            const canSeeAll = await canSeeAllLessons(userId, courseId);

            const result = await LessonService.getLessonsByCourse(courseId, canSeeAll);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('getLessonsByCourse error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getLesson(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { lessonId } = req.params as { lessonId: string };

            const lesson = await Lesson.findById(lessonId).select('course').lean();
            if (!lesson) {
                res.status(404).json({ success: false, message: 'Lesson not found.', code: 'LESSON_NOT_FOUND' });
                return;
            }

            const canSeeAll = await canSeeAllLessons(userId, lesson.course);

            const result = await LessonService.getLessonById(lessonId, canSeeAll);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('getLesson error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async createLesson(req: Request, res: Response): Promise<void> {
        try {
            const creatorId = (req as any).user.id;
            const { courseId } = req.params as { courseId: string };

            const result = await LessonService.createLesson({
                ...req.body,
                courseId,
                creatorId,
            });
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('createLesson error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async updateLesson(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { lessonId } = req.params as { lessonId: string };

            const result = await LessonService.updateLesson(lessonId, userId, req.body);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('updateLesson error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async deleteLesson(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { lessonId } = req.params as { lessonId: string };

            const result = await LessonService.deleteLesson(lessonId, userId);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('deleteLesson error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async moveLesson(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { lessonId } = req.params as { lessonId: string };

            const result = await LessonService.moveLesson(lessonId, userId, req.body.direction);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err) {
            console.error('moveLesson error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}