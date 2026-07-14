export interface GetCoursesQuery {
    q?: string;
    tag?: string;
    category?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
}