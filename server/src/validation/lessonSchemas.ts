import { z } from 'zod';

const title = z
    .string({ error: 'Title is required.' })
    .trim()
    .min(1, { error: 'Title is required.' })
    .max(150, { error: 'Title must be 150 characters or fewer.' });

const description = z
    .string()
    .trim()
    .max(2000, { error: 'Description must be 2000 characters or fewer.' })
    .optional();

const durationSeconds = z
    .number({ error: 'Duration must be a number.' })
    .int({ error: 'Duration must be whole seconds.' })
    .min(0, { error: 'Duration cannot be negative.' })
    .max(24 * 60 * 60, { error: 'Duration is too long.' })
    .optional();

const media = z
    .object({
        url: z.url({ error: 'The file link is not valid.' }),
        publicId: z.string().min(1).optional(),
    })
    .optional();

export const createLessonSchema = z.object({
    title,
    description,
    contentType: z.enum(['video', 'pdf', 'slides'], { error: 'Choose video, PDF or slides.' }),
    isPreview: z.boolean().optional(),
    deliveryType: z.enum(['upload', 'authenticated']).optional(),
    durationSeconds,
    video: media,
    pdf: media,
    slides: media,
});

export const updateLessonSchema = z.object({
    title: title.optional(),
    description,
    isPreview: z.boolean().optional(),
    durationSeconds,
});

export const moveLessonSchema = z.object({
    direction: z.enum(['up', 'down'], { error: 'Direction must be up or down.' }),
});