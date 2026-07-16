import express from 'express';
import { CourseController } from '../controllers/courseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { UploadController } from '../controllers/fileUploadController';

const router = express.Router();


router.get('/', CourseController.getAllCourses);
router.get('/:slug', CourseController.getCourseBySlug);
router.get('upload-signature', authMiddleware, UploadController.getUploadSignature);

export default router;