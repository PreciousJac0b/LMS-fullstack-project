import { Request, Response } from "express";
import { CourseService } from "../services/courseService";

const statusForCode: Record<string, number> = {
    INVALID_SLUG: 400,   // bad input
    COURSE_NOT_FOUND: 404,   // resource doesn't exist
    COURSE_FOUND: 200,   // success
    INVALID_COURSE_INPUT: 400,
    INVALID_COURSE_PRICE: 400,
    COURSE_CREATED: 201,
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
            const { slug } = req.query;
            const result = await CourseService.getCourseBySlug(slug as string);
            const status = statusForCode[result.code ?? ''] ?? 400;
            res.status(status).json(result);
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
                creatorId: (req as any).user.id,   // from authMiddleware, not the body
            });
            res.status(statusForCode[result.code]).json(result);
        } catch (error) {
            console.error('createCourse error:', error);
            res.status(500).json({ success: false, message: 'Something went wrong.' });
        }
    }
}