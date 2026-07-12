import { Request, Response } from "express";
import { AuthService } from "../services/authService";

export class AuthController {
    static async signup(req: Request, res: Response): Promise<void> {
        try {
            const data = req.body;
            const result = await AuthService.signup(data);
            res.status(result.success ? 200 : 401).json(result);
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
            res.status(result.success ? 200 : 401).json(result);
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            })
        }
    }
}