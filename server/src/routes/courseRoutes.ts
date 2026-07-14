import express from 'express';
import { CourseController } from '../controllers/courseController';

const router = express.Router();


router.get('/', CourseController.getAllCourses);

export default router;