// src/dtos/lesson.dto.ts
import mongoose from 'mongoose';

export type LessonContentType = 'video' | 'pdf' | 'slides' | 'quiz';

interface VideoContent {
    url: string;
    provider?: 'self' | 'youtube' | 'vimeo' | 'mux';
    captionsUrl?: string;
}
interface PdfContent {
    url: string;
    pageCount?: number;
}
interface SlidesContent {
    url: string;
    slideCount?: number;
}

export interface CreateLessonDTO {
    courseId: string;
    creatorId: string;

    title: string;
    description?: string;
    order?: number;
    contentType: LessonContentType;

    isPreview?: boolean;
    durationSeconds?: number;

    video?: VideoContent;
    pdf?: PdfContent;
    slides?: SlidesContent;
    quiz?: mongoose.Types.ObjectId | string;
}

export type UpdateLessonDTO = Partial<Omit<CreateLessonDTO, 'courseId' | 'creatorId'>>;