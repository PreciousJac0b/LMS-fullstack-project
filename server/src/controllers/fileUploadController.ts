import { Request, Response } from "express";
import { UploadService } from "../services/fileUploadService";

const UPLOADABLE_TYPES = ['video', 'pdf', 'slides', 'thumbnail'];

export class UploadController {
    static async getUploadSignature(req: Request, res: Response): Promise<void> {
        try {
            const contentType = String(req.query.contentType ?? '');

            if (!UPLOADABLE_TYPES.includes(contentType)) {
                res.status(400).json({
                    success: false,
                    message: 'contentType must be video, pdf or slides.',
                    code: 'INVALID_CONTENT_TYPE',
                });
                return;
            }

            const isPublic = req.query.access === 'public';
            const result = UploadService.getUploadSignature(contentType, isPublic);
            res.status(200).json(result);
        } catch (error) {
            console.error('signature error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}