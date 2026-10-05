import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { EnrollmentController } from '../controllers/enrollmentController';

const router = express.Router();

router.get('/me', authMiddleware, EnrollmentController.getMyEnrollments);
router.post('/courses/:courseId', authMiddleware, EnrollmentController.enrollFree);
router.get('/courses/:courseId', authMiddleware, EnrollmentController.getEnrollmentForCourse);
router.put('/lessons/:lessonId/progress', authMiddleware, EnrollmentController.updateLessonProgress);

export default router;