import { Router } from 'express';
import { LessonController } from '../controllers/lessonController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { validateBody } from '../middleware/validateBody';
import { createLessonSchema, moveLessonSchema, updateLessonSchema } from '../validation/lessonSchemas';

const router = Router();

const instructorOnly = [authMiddleware, requireRole('instructor', 'admin')];

router.get('/courses/:courseId/lessons', optionalAuthMiddleware, LessonController.getLessonsByCourse);
router.get('/:lessonId', authMiddleware, LessonController.getLesson);

router.post('/courses/:courseId/lessons', ...instructorOnly, validateBody(createLessonSchema), LessonController.createLesson);
router.patch('/:lessonId/move', ...instructorOnly, validateBody(moveLessonSchema), LessonController.moveLesson);
router.patch('/:lessonId', ...instructorOnly, validateBody(updateLessonSchema), LessonController.updateLesson);
router.delete('/:lessonId', ...instructorOnly, LessonController.deleteLesson);

export default router;