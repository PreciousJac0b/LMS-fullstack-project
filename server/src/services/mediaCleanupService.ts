import { getCloudinary } from '../config/cloudinary';
import { Course } from '../models/Course';
import { Lesson } from '../models/Lesson';

type ResourceType = 'video' | 'image' | 'raw';
type DeliveryType = 'upload' | 'authenticated';

export async function removeFileIfUnused(publicId: string, resourceType: ResourceType, type: DeliveryType) {
    const [usedByLesson, usedByCourse] = await Promise.all([
        Lesson.exists({
            $or: [
                { 'video.publicId': publicId },
                { 'pdf.publicId': publicId },
                { 'slides.publicId': publicId },
            ],
        }),
        Course.exists({ thumbnailPublicId: publicId }),
    ]);

    if (usedByLesson || usedByCourse) return;

    await getCloudinary().uploader.destroy(publicId, {
        resource_type: resourceType,
        type,
        invalidate: true,
    });
}