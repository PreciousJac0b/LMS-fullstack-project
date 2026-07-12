import { loginInput, signUpInput } from "../types/auth";
import { User } from "../models/User";
import { HashUtils } from "../utils/hashUtils";
import { JWTUtils } from "../utils/jwtUtils";

export class AuthService {
    static async signup(data: signUpInput) {
        // Implement validation with Joi for the input
        const email = data.email.toLowerCase();
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return {
                success: false,
                message: "User already exists"
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
            data: userWithoutPassword
        }
    }

    static async login(data: loginInput) {
        // Validation with Joi

        const { email, password } = data;

        const normEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normEmail }).select('+password');

        if (!user) {
            return {
                success: false,
                messsage: "This user doesn't exist"
            }
        }

        if (!user.password) {
            return {
                success: false,
                message: "This account uses social sign-in. Please log in with Google."
            }
        }

        const checkPassword = await HashUtils.comparePassword(password, user.password)

        if (!checkPassword) {
            return { success: false, message: 'Invalid password' };
        }

        const accessToken = JWTUtils.generateAccessToken({ id: user.id, role: user.role });

        const refreshToken = JWTUtils.generateRefreshToken({
            id: user.id,
            tokenVersion: user.tokenVersion ?? 0,
        })

        const userSafe = user.toObject();
        const { password: _, ...userWithoutPassword } = userSafe;
        return {
            success: true,
            message: 'User logged in successfully',
            user: userWithoutPassword,
            accessToken,
            refreshToken,
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

        const accessToken = JWTUtils.generateAccessToken({ id: user.id, role: user.role });


        return {
            success: true,
            message: 'Token refreshed successfully.',
            code: 'REFRESH_OK',
            data: accessToken,
        };

    }
}