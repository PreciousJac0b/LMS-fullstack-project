import mongoose from 'mongoose';

export type LessonContentType = 'video' | 'pdf' | 'slides' | 'quiz';

interface VideoContent {
    url: string;
    publicId?: string;
    provider?: 'self' | 'youtube' | 'vimeo' | 'mux';
    captionsUrl?: string;
}
interface PdfContent {
    url: string;
    publicId?: string;
    pageCount?: number;
}
interface SlidesContent {
    url: string;
    publicId?: string;
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
    deliveryType?: 'upload' | 'authenticated';
    durationSeconds?: number;

    video?: VideoContent;
    pdf?: PdfContent;
    slides?: SlidesContent;
    quiz?: mongoose.Types.ObjectId | string;
}

export type UpdateLessonDTO = Partial<Omit<CreateLessonDTO, 'courseId' | 'creatorId'>>;