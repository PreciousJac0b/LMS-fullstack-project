import { Request, Response, CookieOptions } from "express";
import { AuthService } from "../services/authService";

const isProd = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE_NAME = 'lms_rt';
export const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const statusForCode: Record<string, number> = {
    SIGNUP_OK: 201,
    USER_EXISTS: 409,
    LOGIN_OK: 200,
    INVALID_CREDENTIALS: 401,
    SOCIAL_ACCOUNT: 400,
    REFRESH_OK: 200,
    REFRESH_INVALID: 401,
    REFRESH_REVOKED: 401,
    USER_NOT_FOUND: 401,
    ME_OK: 200,
    EMAIL_VERIFIED: 200,
    VERIFY_TOKEN_INVALID: 400,
    ALREADY_VERIFIED: 200,
    VERIFICATION_SENT: 200,
    EMAIL_SEND_FAILED: 503,
    RESET_REQUESTED: 200,
    RESET_TOKEN_INVALID: 400,
    PASSWORD_RESET: 200,
};

export class AuthController {
    static async signup(req: Request, res: Response): Promise<void> {
        try {
            const data = req.body;
            const result = await AuthService.signup(data);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            })
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });

            if (!result.success || !result.data) {
                res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
                return;
            }

            const { refreshToken, ...safeData } = result.data;
            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
            res.status(200).json({ ...result, data: safeData });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            })
        }
    }

    static async refresh(req: Request, res: Response): Promise<void> {
        try {
            const token = req.cookies?.[REFRESH_COOKIE_NAME];

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'No refresh token. Please log in.',
                    code: 'NO_REFRESH_TOKEN',
                });
                return;
            }

            const result = await AuthService.refresh(token);

            if (!result.success) {
                res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
                res.status(401).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            });
        }
    }

    static async me(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const result = await AuthService.getMe(userId);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async logout(req: Request, res: Response): Promise<void> {
        try {
            const result = await AuthService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
            res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
            res.status(200).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async logoutAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await AuthService.logoutAll(req.cookies?.[REFRESH_COOKIE_NAME]);
            res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
            res.status(200).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const result = await AuthService.verifyEmail(req.body.token);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async resendVerification(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const result = await AuthService.resendVerification(userId);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const result = await AuthService.requestPasswordReset(req.body.email);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, password } = req.body;
            const result = await AuthService.resetPassword(token, password);

            if (result.success) {
                res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
            }

            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}