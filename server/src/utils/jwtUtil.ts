import jwt from "jsonwebtoken";

interface JWTPayload {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

export class JWTUtils {
    private static getTokenSecret(): string {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return secret
    }

    static generateToken(payload: JWTPayload) {
        const secret = this.getTokenSecret();

        const token = jwt.sign(payload, secret, {
            expiresIn: '1h',
        });

        return token
    }

    static verifyAccessToken(token: string): JWTPayload {
        const secret = this.getTokenSecret();
        return jwt.verify(token, secret) as JWTPayload;
    }
}