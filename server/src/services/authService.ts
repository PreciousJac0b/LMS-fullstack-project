import { loginInput, signUpInput } from "../types/auth";
import { User } from "../models/User";
import { HashUtils } from "../utils/hashUtils";
import { JWTUtils } from "../utils/jwtUtils";
import { Session } from "../models/Session";
import crypto from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class AuthService {
    static async signup(data: signUpInput) {
        // Implement validation with Joi for the input
        const email = data.email.toLowerCase();
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return {
                success: false,
                message: "User already exists",
                code: 'USER_EXISTS',
            }
        }

        const hashedPassword = await HashUtils.hashPassword(data.password);

        const { firstName, lastName } = data;

        const user = new User({ email, firstName, lastName, password: hashedPassword, authProvider: 'local' })

        const savedUser = await user.save();

        const { password, ...userWithoutPassword } = savedUser.toObject();

        return {
            success: true,
            message: "User Successfully Created.",
            code: 'SIGNUP_OK',
            data: userWithoutPassword
        }
    }

    static async login(data: loginInput) {
        // Validation with Joi

        const { email, password } = data;

        const normEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normEmail }).select('+password +tokenVersion');

        if (!user) {
            return {
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            };
        }

        if (!user.password) {
            return {
                success: false,
                message: "This account uses social sign-in. Please log in with Google.",
                code: 'SOCIAL_ACCOUNT',
            }
        }

        const checkPassword = await HashUtils.comparePassword(password, user.password)

        if (!checkPassword) {
            return { success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
        }

        const accessToken = JWTUtils.generateAccessToken({ id: user.id, role: user.role });

        const session = await Session.create({
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        const refreshToken = JWTUtils.generateRefreshToken({
            id: user.id,
            tokenVersion: user.tokenVersion ?? 0,
            sid: session.id,
        })

        const userSafe = user.toObject();
        const { password: _, ...userWithoutPassword } = userSafe;
        return {
            success: true,
            message: 'User logged in successfully',
            code: 'LOGIN_OK',
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            }
        };
    }

    static async refresh(refreshToken: string) {
        const decoded = JWTUtils.verifyRefreshToken(refreshToken);
        if ('error' in decoded) {
            return {
                success: false,
                message: 'Invalid or expired refresh token. Please log in again.',
                code: 'REFRESH_INVALID',
            };
        }

        const user = await User.findById(decoded.id).select('+tokenVersion');
        if (!user) {
            return {
                success: false,
                message: 'User no longer exists.',
                code: 'USER_NOT_FOUND',
            };
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            return {
                success: false,
                message: 'Refresh token has been revoked. Please log in again.',
                code: 'REFRESH_REVOKED',
            };
        }

        if (!decoded.sid) {
            return {
                success: false,
                message: 'Session not found. Please log in again.',
                code: 'REFRESH_REVOKED',
            };
        }

        const session = await Session.findOne({ _id: decoded.sid, user: user._id });
        if (!session) {
            return {
                success: false,
                message: 'Session has ended. Please log in again.',
                code: 'REFRESH_REVOKED',
            };
        }

        const accessToken = JWTUtils.generateAccessToken({ id: user.id, role: user.role });


        return {
            success: true,
            message: 'Token refreshed successfully.',
            code: 'REFRESH_OK',
            data: accessToken,
        };

    }

    static async requestPasswordReset(email: string) {
        const normEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normEmail });

        const genericResult = {
            success: true,
            message: 'If an account exists for that email, a reset link has been sent.',
            code: 'RESET_REQUESTED',
        };

        if (!user || user.authProvider !== 'local') return genericResult;

        const rawToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = HashUtils.hashToken(rawToken);   // sync now
        user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await user.save();

        // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(normEmail)}`;

        // // Don't let an email failure surface details to the caller
        // try {
        //     // await EmailService.sendPasswordReset(normEmail, resetUrl, user.firstName);
        // } catch (err) {
        //     console.error('Failed to send reset email:', err);
        //     // Still return generic success — don't reveal the address exists via an error
        // }

        return genericResult;

    }

    static async getMe(userId: string) {
        const user = await User.findById(userId).lean();

        if (!user) {
            return {
                success: false,
                message: 'User no longer exists.',
                code: 'USER_NOT_FOUND',
            };
        }

        return {
            success: true,
            message: 'User retrieved.',
            code: 'ME_OK',
            data: user,
        };
    }

    static async logout(refreshToken?: string) {
        if (refreshToken) {
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);
            if (!('error' in decoded) && decoded.sid) {
                await Session.deleteOne({ _id: decoded.sid });
            }
        }

        return { success: true, message: 'Logged out successfully.', code: 'LOGOUT_OK' };
    }

    static async logoutAll(refreshToken?: string) {
        if (refreshToken) {
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);
            if (!('error' in decoded)) {
                await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
                await Session.deleteMany({ user: decoded.id });
            }
        }

        return { success: true, message: 'Logged out of all devices.', code: 'LOGOUT_ALL_OK' };
    }
}