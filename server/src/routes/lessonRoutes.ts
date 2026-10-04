import { Router } from 'express';
import { LessonController } from '../controllers/lessonController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';

const router = Router();

router.get('/courses/:courseId/lessons', optionalAuthMiddleware, LessonController.getLessonsByCourse); // previews public
router.get('/:lessonId', authMiddleware, LessonController.getLesson);   // gated content

router.post('/courses/:courseId/lessons', authMiddleware, requireRole('instructor', 'admin'), LessonController.createLesson);
router.patch('/:lessonId', authMiddleware, requireRole('instructor', 'admin'), LessonController.updateLesson);
router.delete('/:lessonId', authMiddleware, requireRole('instructor', 'admin'), LessonController.deleteLesson);

export default router;