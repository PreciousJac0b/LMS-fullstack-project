import { Request, Response } from "express";
import { UploadService } from "../services/fileUploadService";

export class UploadController {
    static async getUploadSignature(req: Request, res: Response): Promise<void> {
        try {
            const contentType = String(req.query.contentType ?? 'video');
            const isPublic = req.query.access === 'public';
            const result = UploadService.getUploadSignature(contentType, isPublic);
            res.status(200).json(result);
        } catch (error) {
            console.error('signature error:', error);
            res.status(500).json({ success: false, message: 'Something went wrong.' });
        }
    };
}