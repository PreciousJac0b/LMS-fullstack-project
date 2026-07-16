import cloudinary from '../config/cloudinary';

function resourceTypeFor(contentType: string): 'video' | 'image' | 'raw' {
    switch (contentType) {
        case 'video':  return 'video';
        case 'pdf':    return 'image';
        case 'slides': return 'raw';
        default:       return 'raw';
    }
}

export class UploadService {
    static getUploadSignature(contentType: string) {
        const timestamp = Math.round(Date.now() / 1000);
        const folder = `courses/${contentType}s`;

        
        const paramsToSign = { timestamp, folder };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!,
        );

        return {
            success: true,
            message: 'Upload signature generated.',
            code: 'SIGNATURE_CREATED',
            data: {
                signature,
                timestamp,
                folder,
                apiKey: process.env.CLOUDINARY_API_KEY,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                resourceType: resourceTypeFor(contentType),
            },
        };
    }
}