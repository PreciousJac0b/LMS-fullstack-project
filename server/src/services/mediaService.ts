import { getCloudinary } from '../config/cloudinary';

// The lesson shape we need — just the content blocks + type
interface LessonContent {
    contentType: 'video' | 'pdf' | 'slides' | 'quiz';
    isPreview?: boolean;
    deliveryType?: 'upload' | 'authenticated';
    video?: { url?: string; publicId?: string; };
    pdf?: { url?: string; publicId?: string;};
    slides?: { url?: string; publicId?: string; };
}

type MediaResult =
    | { success: true; url: string }
    | { success: false; code: 'NO_MEDIA_FOR_TYPE' | 'MISSING_PUBLIC_ID' | 'MISSING_URL' };

// How long a signed paid-content URL stays valid (seconds)
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export function resolveMediaUrl(lesson: LessonContent): MediaResult {
    // Pick the content block that matches this lesson's type
    const block =
        lesson.contentType === 'video' ? lesson.video :
            lesson.contentType === 'pdf' ? lesson.pdf :
                lesson.contentType === 'slides' ? lesson.slides :
                    null;

    if (!block) {
        return { success: false, code: 'NO_MEDIA_FOR_TYPE' };
    }
    const { url, publicId } = block;
    const deliveryType = lesson.deliveryType ?? 'upload';

    if (deliveryType === 'upload') {
        if (!url) return { success: false, code: 'MISSING_URL' };
        return { success: true, url };
    }

    if (!publicId) {
        return { success: false, code: 'MISSING_PUBLIC_ID' };
    }

    const resourceType =
        lesson.contentType === 'video' ? 'video' :
            lesson.contentType === 'pdf' ? 'image' : 'raw';

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL;

    const signedUrl = getCloudinary().url(publicId, {
        resource_type: resourceType,
        type: 'authenticated',
        sign_url: true,
        expires_at: expiresAt,
        secure: true,
    });

    // Signed, time-limited, authenticated delivery URL
    return { success: true, url: signedUrl };
}