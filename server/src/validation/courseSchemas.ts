import { z } from 'zod';

export const createCourseSchema = z.object({
    title: z
        .string({ error: 'Title is required.' })
        .trim()
        .min(3, { error: 'Title must be at least 3 characters.' })
        .max(120, { error: 'Title must be 120 characters or fewer.' }),
    description: z
        .string({ error: 'Description is required.' })
        .trim()
        .min(20, { error: 'Description must be at least 20 characters.' })
        .max(5000, { error: 'Description must be 5000 characters or fewer.' }),
    level: z.enum(['beginner', 'intermediate', 'advanced'], { error: 'Choose a level.' }).optional(),
    category: z.string().trim().max(50, { error: 'Category must be 50 characters or fewer.' }).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    tags: z
        .array(z.string().trim().min(1).max(30, { error: 'Each tag must be 30 characters or fewer.' }))
        .max(10, { error: 'Use at most 10 tags.' })
        .optional(),
    price: z
        .number({ error: 'Price must be a number.' })
        .int({ error: 'Price must be a whole number of kobo.' })
        .min(0, { error: 'Price cannot be negative.' })
        .optional(),
    isFree: z.boolean().optional(),
    thumbnailUrl: z.url({ error: 'Thumbnail must be a valid link.' }).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
    status: z.enum(['draft', 'published', 'unpublished'], { error: 'Invalid status.' }).optional(),
});