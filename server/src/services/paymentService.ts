import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';

const PAYSTACK_BASE = 'https://api.paystack.co';
const paystack = axios.create({
    baseURL: PAYSTACK_BASE,
});

paystack.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
    return config;
});

export class PaymentService {
    static async initializePayment(userId: string, courseId: string) {
        if (!mongoose.isValidObjectId(courseId)) {
            return {
                success: false,
                message: 'Invalid course id.',
                code: 'INVALID_COURSE_ID',
            };
        }
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return {
                success: false,
                message: 'Course not found.',
                code: 'COURSE_NOT_FOUND'
            };
        }
        if (course.isFree || course.price <= 0) {
            return {
                success: false,
                message: 'This course is free — no payment needed.',
                code: 'COURSE_IS_FREE'
            };
        }

        const already = await Enrollment.findOne({ user: userId, course: courseId }).lean();
        if (already) {
            return {
                success: false,
                message: 'You already own this course.',
                code: 'ALREADY_ENROLLED'
            };
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return {
                success: false,
                message: 'User not found.',
                code: 'USER_NOT_FOUND'
            };
        }

        const reference = `crs_${courseId}_${userId}_${crypto.randomBytes(6).toString('hex')}`;

        await Payment.create({
            user: userId,
            course: courseId,
            reference,
            amount: course.price,
            currency: course.currency ?? 'NGN',
            status: 'pending',
        });

        const { data } = await paystack.post('/transaction/initialize', {
            email: user.email,
            amount: course.price,
            currency: course.currency ?? 'NGN',
            reference,
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: { courseId, userId },
        });

        return {
            success: true,
            message: 'Payment initialized.',
            code: 'PAYMENT_INITIALIZED',
            data: {
                authorizationUrl: data.data.authorization_url,
                reference,
            },
        };
    }

    static async verifyPayment(reference: string) {
        const payment = await Payment.findOne({ reference });
        if (!payment) {
            return {
                success: false,
                message: 'Unknown payment reference.',
                code: 'PAYMENT_NOT_FOUND'
            };
        }

        if (payment.status === 'success') {
            return { success: true, message: 'Payment already verified.', code: 'PAYMENT_ALREADY_VERIFIED' };
        }

        const { data } = await paystack.get(`/transaction/verify/${reference}`);
        const txn = data.data;

        if (txn.status !== 'success') {
            payment.status = 'failed';
            payment.paystackData = txn;
            await payment.save();
            return {
                success: false,
                message: 'Payment was not successful.',
                code: 'PAYMENT_FAILED'
            };
        }

        if (txn.amount !== payment.amount) {
            payment.status = 'failed';
            payment.paystackData = txn;
            await payment.save();
            return {
                success: false,
                message: 'Payment amount mismatch.',
                code: 'PAYMENT_AMOUNT_MISMATCH'
            };
        }

        payment.status = 'success';
        payment.paystackData = txn;
        await payment.save();

        await Enrollment.updateOne(
            { user: payment.user, course: payment.course },
            { $setOnInsert: { user: payment.user, course: payment.course, payment: payment._id } },
            { upsert: true },
        );

        // Denormalized counter on the course
        await Course.updateOne({ _id: payment.course }, { $inc: { enrollmentCount: 1 } });

        return {
            success: true,
            message: 'Payment verified and access granted.',
            code: 'PAYMENT_VERIFIED',
            data: { courseId: payment.course },
        };
    }
}