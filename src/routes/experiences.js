import express from 'express';
import formData from 'express-form-data';
import {
  createExperience,
  deleteExperience,
  getAllExperiences,
  getExperienceById,
  getExperiences,
  updateExperience
} from '../controllers/experiencesController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(formData.parse());

// للمستخدمين والزوار
router.get('/', getExperiences);
router.get('/:id', getExperienceById);

// للأدمن فقط
router.get('/all', isAdmin, getAllExperiences);
router.post('/', isAdmin, createExperience);
router.put('/:id', isAdmin, updateExperience);
router.delete('/:id', isAdmin, deleteExperience);

export default router;
