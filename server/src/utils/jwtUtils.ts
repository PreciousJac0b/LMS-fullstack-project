import jwt from "jsonwebtoken";

interface JWTPayload {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    tokenVersion?: number;
    error?: any;
}

export class JWTUtils {
    private static getAccessTokenSecret(): string {
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return secret
    }
    private static getRefreshTokenSecret(): string {
        const secret = process.env.JWT_REFRESH_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return secret
    }

    static generateAccessToken(payload: { id: string; role: string }) {
        const secret = this.getAccessTokenSecret();

        const token = jwt.sign(payload, secret, {
            expiresIn: '15m',
        });

        return token
    }

    static generateRefreshToken(payload: { id: string; tokenVersion: number }) {
        const secret = this.getRefreshTokenSecret();

        const token = jwt.sign(payload, secret, {
            expiresIn: '7d',
        });

        return token
    }

    static verifyAccessToken(token: string): JWTPayload | { error: string} {
        try {
            const secret = this.getAccessTokenSecret();
            return jwt.verify(token, secret) as JWTPayload;
        } catch (err: any) {
            return {
                error: err.name
            }
        }
    }

    static verifyRefreshToken(token: string): JWTPayload {
        const secret = this.getRefreshTokenSecret();
        return jwt.verify(token, secret) as JWTPayload;
    }
}