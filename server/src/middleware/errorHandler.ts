import { Request, Response, NextFunction } from 'express';
import { LoggerUtils } from '../utils/loggerUtils';


export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({
            success: false,
            message: 'The request body is not valid JSON.',
            code: 'INVALID_JSON',
        });
        return;
    }

    LoggerUtils.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
    });
};