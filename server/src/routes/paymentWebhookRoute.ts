import express from 'express';
import { PaymentController } from "../controllers/paymentController";

const router = express.Router();

// express.raw keeps the body as raw bytes so the signature check can work
router.post(
    '/webhook/paystack',
    express.raw({ type: 'application/json' }),
    PaymentController.handleWebhook,
);

export default router;