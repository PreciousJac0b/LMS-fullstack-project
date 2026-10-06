import { z } from 'zod';
import { createCourseSchema, updateCourseSchema } from '../validation/courseSchemas';

export interface GetCoursesQuery {
    q?: string;
    tag?: string;
    category?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
    level?: string;
}

export type CreateCourseDTO = z.infer<typeof createCourseSchema> & { creatorId: string };
export type UpdateCourseDTO = z.infer<typeof updateCourseSchema>;