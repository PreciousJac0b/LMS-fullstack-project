import mongoose, { Document } from 'mongoose';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'unpublished';

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  instructors: mongoose.Types.ObjectId[];

  tags: string[];
  category?: string;
  level: CourseLevel;
  language: string;

  price: number;                          // in minor units
  currency: string;
  isFree: boolean;

  thumbnailUrl?: string;
  status: CourseStatus;                   // draft/published/unpublished 

  lessons: mongoose.Types.ObjectId[];
  totalDurationSeconds: number;           // derived from lessons/videos
  enrollmentCount: number;                // denormalized counter

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },

    instructors:[ {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    }],

    tags: { type: [String], default: [], index: true },
    category: { type: String, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    language: { type: String, default: 'en' },

    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'NGN' },
    isFree: { type: Boolean, default: false },

    thumbnailUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished'],
      default: 'draft',
      index: true,
    },

    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    totalDurationSeconds: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },

    publishedAt: { type: Date },
  },
  { timestamps: true },
);

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Course = mongoose.model<ICourse>('Course', courseSchema);