import mongoose, { Document } from 'mongoose';

export interface ILessonProgress {
  lesson: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
}

export interface ITestScore {
  quiz: mongoose.Types.ObjectId;
  score: number;
  takenAt: Date;
}

export interface IEnrollment extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  payment?: mongoose.Types.ObjectId;

  lessonProgress: ILessonProgress[];
  completionPercentage: number;
  hoursSpent: number;
  testScores: ITestScore[];

  completedAt?: Date;
  certificateUrl?: string;

  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new mongoose.Schema<IEnrollment>(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    lessonProgress: [
      {
        lesson:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
        completed:   { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    hoursSpent: { type: Number, default: 0 },
    testScores: [
      {
        quiz:    { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
        score:   { type: Number, required: true },
        takenAt: { type: Date, default: Date.now },
      },
    ],

    completedAt: { type: Date },
    certificateUrl: { type: String },

    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);