import { Request, Response } from "express";
import { CourseService } from "../services/courseService";

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
}