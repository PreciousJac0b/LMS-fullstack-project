import mongoose, { Document } from 'mongoose';

export type UserRole = 'learner' | 'instructor' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;  // Only blank for SSO-only accounts
  role: UserRole;
  authProvider: AuthProvider;
  providerId?: string;            // ID returned by the SSO provider
  isEmailVerified: boolean;

  tokenVersion: number;

  // Account recovery
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  enrollments?: mongoose.Types.ObjectId[];

  createdCourses?: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    password: {
      type: String,
      required: function (this: IUser) { return this.authProvider === 'local'; },
      select: false,
    },
    role: { type: String, enum: ['learner', 'instructor', 'admin'], default: 'learner' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    providerId: { type: String },
    isEmailVerified: { type: Boolean, default: false },

    tokenVersion: { type: Number, default: 0, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    enrollments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
    createdCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', userSchema);