import mongoose from "mongoose";

export interface GetCoursesQuery {
    q?: string;
    tag?: string;
    category?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
}


export interface CreateCourseDTO {
    title: string;
    description: string;
    tags?: string[];
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    price?: number;
    currency?: string;
    isFree?: boolean;
    thumbnailUrl?: string;

    creatorId: mongoose.Types.ObjectId | string;
}