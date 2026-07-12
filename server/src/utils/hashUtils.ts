import bcrypt from 'bcrypt';

export class HashUtils {
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        return hashed;
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        const result = await bcrypt.compare(password, hashedPassword);
        return result;
    }
}