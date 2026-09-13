import { Request, Response } from "express";
import crypto from "crypto";
import { PaymentService } from "../services/paymentService";

const statusForCode: Record<string, number> = {
    COURSE_NOT_FOUND: 404,
    COURSE_IS_FREE: 400,
    ALREADY_ENROLLED: 409,
    USER_NOT_FOUND: 404,
    PAYMENT_INITIALIZED: 200,
    PAYMENT_NOT_FOUND: 404,
    PAYMENT_FAILED: 400,
    PAYMENT_AMOUNT_MISMATCH: 400,
    PAYMENT_ALREADY_VERIFIED: 200,
    PAYMENT_VERIFIED: 200,
};

export class PaymentController {
    static async initializePayment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;         // from authMiddleware, not the body
            const { courseId } = req.params;
            const result = await PaymentService.initializePayment(userId, courseId as string);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            console.error('initializePayment error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async verifyPayment(req: Request, res: Response): Promise<void> {
        try {
            // const { reference } = req.params;
            const raw = req.query.reference;
            const reference = Array.isArray(raw) ? raw[0] : raw;

            if (typeof reference !== 'string' || !reference) {
                res.status(400).json({
                    success: false,
                    message: 'Missing or invalid payment reference.',
                    code: 'INVALID_REFERENCE',
                });
                return;
            }
            const result = await PaymentService.verifyPayment(reference);
            res.status(statusForCode[result.code ?? ''] ?? 400).json(result);
        } catch (err: any) {
            console.error('verifyPayment error:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async handleWebhook(req: Request, res: Response): Promise<void> {
        try {
            // 1. Verify the event genuinely came from Paystack (HMAC over the RAW body)
            const hash = crypto
                .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
                .update(req.body)                        // req.body is a Buffer here — see note
                .digest('hex');

            if (hash !== req.headers['x-paystack-signature']) {
                res.sendStatus(401);                     // forged → reject, no body
                return;
            }

            // 2. Parse only after the signature check passes
            const event = JSON.parse(req.body.toString());

            // 3. Acknowledge FIRST, so Paystack doesn't retry while we work
            res.sendStatus(200);

            // 4. Then fulfil (idempotent — safe if the callback already verified it)
            if (event.event === 'charge.success') {
                await PaymentService.verifyPayment(event.data.reference);
            }
        } catch (err: any) {
            console.error('paystack webhook error:', err);
            // If we haven't already responded, tell Paystack to retry later
            if (!res.headersSent) res.sendStatus(500);
        }
    }
}