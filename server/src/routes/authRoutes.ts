import express from "express";
import { validateBody } from '../middleware/validateBody';
import {
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
    signupSchema,
    verifyEmailSchema,
} from '../validation/authSchemas';
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";


const router = express.Router()


router.post('/signup', validateBody(signupSchema), AuthController.signup);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);
router.get('/me', authMiddleware, AuthController.me);
router.post('/verify-email', validateBody(verifyEmailSchema), AuthController.verifyEmail);
router.post('/verify-email/resend', authMiddleware, AuthController.resendVerification);
router.post('/forgot-password', validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);

export default router;