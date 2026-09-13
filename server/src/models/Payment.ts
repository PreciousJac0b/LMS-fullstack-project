import mongoose, { Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paystackData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  reference: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paystackData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);