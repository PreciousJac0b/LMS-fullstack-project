import express from 'express';
import { CourseController } from '../controllers/courseController';
import { UploadController } from '../controllers/fileUploadController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validateBody';
import { createCourseSchema, updateCourseSchema } from '../validation/courseSchemas';

const router = express.Router();

const instructorOnly = [authMiddleware, requireRole('instructor', 'admin')];

router.get('/', CourseController.getAllCourses);
router.post('/', ...instructorOnly, validateBody(createCourseSchema), CourseController.createCourse);

router.get('/upload-signature', ...instructorOnly, UploadController.getUploadSignature);
router.get('/mine', ...instructorOnly, CourseController.getMyCourses);
router.get('/:courseId/manage', ...instructorOnly, CourseController.getCourseForEditing);
router.patch('/:courseId', ...instructorOnly, validateBody(updateCourseSchema), CourseController.updateCourse);

router.get('/:slug', CourseController.getCourseBySlug);

export default router;