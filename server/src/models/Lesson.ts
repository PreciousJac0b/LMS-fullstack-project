import mongoose, { Document } from 'mongoose';

export type LessonContentType = 'video' | 'pdf' | 'slides' | 'quiz';

export interface ILesson extends Document {
  course: mongoose.Types.ObjectId;   // which course this belongs to
  title: string;
  description?: string;
  order: number;                     // position within the course (1, 2, 3…)
  contentType: LessonContentType;

  // Common
  isPreview: boolean;                // viewable without enrolling? (marketing)
  durationSeconds: number;           // video length, or est. reading/quiz time

  // Type-specific (only the relevant one is populated)
  video?: {
    url: string;                     // streaming/hosted URL
    provider?: 'self' | 'youtube' | 'vimeo' | 'mux';
    captionsUrl?: string;
  };
  pdf?: {
    url: string;
    pageCount?: number;
  };
  slides?: {
    url: string;
    slideCount?: number;
  };
  quiz?: mongoose.Types.ObjectId;    // ref to a Quiz/Test model (Req 9)

  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new mongoose.Schema<ILesson>(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,                   // fast "all lessons for this course"
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, default: 0 },
    contentType: {
      type: String,
      enum: ['video', 'pdf', 'slides', 'quiz'],
      required: true,
    },

    isPreview: { type: Boolean, default: false },
    durationSeconds: { type: Number, default: 0 },

    video: {
      url: { type: String },
      provider: { type: String, enum: ['self', 'youtube', 'vimeo', 'mux'], default: 'self' },
      captionsUrl: { type: String },
    },
    pdf: {
      url: { type: String },
      pageCount: { type: Number },
    },
    slides: {
      url: { type: String },
      slideCount: { type: Number },
    },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  },
  { timestamps: true },
);

// Lessons are almost always fetched by course, in order
lessonSchema.index({ course: 1, order: 1 });

export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema);