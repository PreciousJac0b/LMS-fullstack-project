import express from 'express';
import { authMiddleware } from "../middleware/authMiddleware";
import { PaymentController } from "../controllers/paymentController";


const router = express.Router();

router.post('/pay/:courseId', authMiddleware, PaymentController.initializePayment);
router.get('/pay/verify/:reference', authMiddleware, PaymentController.verifyPayment);

export default router;