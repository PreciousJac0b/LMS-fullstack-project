import { loginInput, signUpInput } from "../types/auth";
import { User } from "../models/User";
import { HashUtils } from "../utils/hashUtils";
import { JWTUtils } from "../utils/jwtUtils";
import { Session } from "../models/Session";
import { EmailUtils } from '../utils/emailUtils';
import { LoggerUtils } from '../utils/loggerUtils';
import crypto from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export class AuthService {
    static async signup(data: signUpInput) {
        const { email, firstName, lastName } = data;
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return {
                success: false,
                message: "User already exists",
                code: 'USER_EXISTS',
            }
        }

        const hashedPassword = await HashUtils.hashPassword(data.password);

        const user = new User({ email, firstName, lastName, password: hashedPassword, authProvider: 'local' })

        const savedUser = await user.save();

        const emailSent = await this.sendVerificationLink(savedUser.id, savedUser.email, savedUser.firstName);

        const { password, ...userWithoutPassword } = savedUser.toObject();

        return {
            success: true,
            message: emailSent
                ? 'Account created. Check your inbox to confirm your email.'
                : 'Account created, but we could not send the confirmation email. You can resend it after logging in.',
            code: 'SIGNUP_OK',
            data: userWithoutPassword
        }
    }

    static async login(data: loginInput) {
        const { email, password } = data;

        const user = await User.findOne({ email }).select('+password +tokenVersion');

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
        const { password: _, tokenVersion: __, createdCourses, ...userWithoutPassword } = userSafe;
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
        const user = await User.findOne({ email });

        if (user && user.authProvider === 'local') {
            this.sendResetLink(user.id, user.email, user.firstName).catch((error) => {
                LoggerUtils.error('Failed to start password reset', { error: String(error) });
            });
        }

        return {
            success: true,
            message: 'If an account exists for that email, we have sent a link to reset the password.',
            code: 'RESET_REQUESTED',
        };
    }

    private static async sendResetLink(userId: string, email: string, firstName?: string) {
        const rawToken = crypto.randomBytes(32).toString('hex');

        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    passwordResetToken: HashUtils.hashToken(rawToken),
                    passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
                },
            },
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
        return EmailUtils.sendPasswordResetEmail(email, resetUrl, firstName);
    }

    static async resetPassword(rawToken: string, newPassword: string) {
        const hashedPassword = await HashUtils.hashPassword(newPassword);

        const user = await User.findOneAndUpdate(
            {
                passwordResetToken: HashUtils.hashToken(rawToken),
                passwordResetExpires: { $gt: new Date() },
            },
            {
                $set: { password: hashedPassword, isEmailVerified: true },
                $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
                $inc: { tokenVersion: 1 },
            },
        );

        if (!user) {
            return {
                success: false,
                message: 'This link is invalid, has expired, or has already been used.',
                code: 'RESET_TOKEN_INVALID',
            };
        }

        await Session.deleteMany({ user: user._id });

        return {
            success: true,
            message: 'Your password has been reset. Please log in with your new password.',
            code: 'PASSWORD_RESET',
        };
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

    private static async sendVerificationLink(userId: string, email: string, firstName?: string) {
        const rawToken = crypto.randomBytes(32).toString('hex');

        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    emailVerificationToken: HashUtils.hashToken(rawToken),
                    emailVerificationExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
                },
            },
        );

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
        return EmailUtils.sendVerificationEmail(email, verifyUrl, firstName);
    }

    static async verifyEmail(rawToken: string) {
        const user = await User.findOneAndUpdate(
            {
                emailVerificationToken: HashUtils.hashToken(rawToken),
                emailVerificationExpires: { $gt: new Date() },
            },
            {
                $set: { isEmailVerified: true },
                $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
            },
        );

        if (!user) {
            return {
                success: false,
                message: 'This link is invalid, has expired, or has already been used.',
                code: 'VERIFY_TOKEN_INVALID',
            };
        }

        return { success: true, message: 'Your email is confirmed.', code: 'EMAIL_VERIFIED' };
    }

    static async resendVerification(userId: string) {
        const user = await User.findById(userId);

        if (!user) {
            return { success: false, message: 'User no longer exists.', code: 'USER_NOT_FOUND' };
        }
        if (user.isEmailVerified) {
            return { success: true, message: 'Your email is already confirmed.', code: 'ALREADY_VERIFIED' };
        }

        const sent = await this.sendVerificationLink(user.id, user.email, user.firstName);
        if (!sent) {
            return {
                success: false,
                message: 'We could not send the email right now. Please try again shortly.',
                code: 'EMAIL_SEND_FAILED',
            };
        }

        return { success: true, message: `We've sent a new link to ${user.email}.`, code: 'VERIFICATION_SENT' };
    }
}