import { loginInput, signUpInput } from "../types/auth";
import { User } from "../models/User";
import { HashUtils } from "../utils/hashUtils";
import { JWTUtils } from "../utils/jwtUtil";

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
                success: "false",
                message: "This account uses social sign-in. Please log in with Google."
            }
        }

        const checkPassword = await HashUtils.comparePassword(password, user.password)

        if (!checkPassword) {
            return { success: false, message: 'Invalid password' };
        }

        const token = JWTUtils.generateToken({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });

        const userSafe = user.toObject();
        const { password: _, ...userWithoutPassword } = userSafe;
        return {
            success: true,
            message: 'User logged in successfully',
            user: userWithoutPassword,
            token,
        };
    }
}