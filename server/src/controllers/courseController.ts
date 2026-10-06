import { Request, Response } from "express";
import { CourseService } from "../services/courseService";

const statusForCode: Record<string, number> = {
    INVALID_SLUG: 400,
    INVALID_COURSE_ID: 400,
    COURSE_NOT_FOUND: 404,
    COURSE_FOUND: 200,
    MY_COURSES_FOUND: 200,
    INVALID_COURSE_PRICE: 400,
    COURSE_HAS_NO_LESSONS: 400,
    COURSE_CREATED: 201,
    COURSE_UPDATED: 200,
    FORBIDDEN: 403,
};

export class CourseController {
    static async getAllCourses(req: Request, res: Response): Promise<void> {
        try {
            const query = req.query;
            const result = await CourseService.getAllCourses(query);
            res.status(result.success ? 200 : 400).json(result);
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
            })
        }
    }

    static async getCourseBySlug(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            const result = await CourseService.getCourseBySlug(slug as string);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            console.error('getCourseBySlug error: ', err);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
            })
        }
    }

    static async createCourse(req: Request, res: Response): Promise<void> {
        try {
            const result = await CourseService.createCourse({
                ...req.body,
                creatorId: (req as any).user.id,
            });
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (error) {
            console.error('createCourse error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getMyCourses(req: Request, res: Response): Promise<void> {
        try {
            const result = await CourseService.getMyCourses((req as any).user.id);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (error) {
            console.error('getMyCourses error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getCourseForEditing(req: Request, res: Response): Promise<void> {
        try {
            const { courseId } = req.params as { courseId: string };
            const result = await CourseService.getCourseForEditing(courseId, (req as any).user.id);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (error) {
            console.error('getCourseForEditing error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async updateCourse(req: Request, res: Response): Promise<void> {
        try {
            const { courseId } = req.params as { courseId: string };
            const result = await CourseService.updateCourse(courseId, (req as any).user.id, req.body);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (error) {
            console.error('updateCourse error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}