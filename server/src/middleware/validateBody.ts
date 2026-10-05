import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateBody = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body ?? {});

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: 'Some fields need attention.',
                code: 'VALIDATION_ERROR',
                errors: z.flattenError(result.error).fieldErrors,
            });
            return;
        }

        req.body = result.data;
        next();
    };
};