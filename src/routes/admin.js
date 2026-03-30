import cors from 'cors';
import express from 'express';
import formData from 'express-form-data';
import helmet from 'helmet';
import { adminLogin, createUser, deleteUser, getUsers, updateUser } from '../controllers/adminController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());
router.use(helmet());
router.use(formData.parse());
// POST /api/admin/login
router.post('/login', adminLogin);

// إدارة المستخدمين (محميّة)
router.post('/users', isAdmin, createUser);
router.get('/users', isAdmin, getUsers);
router.put('/users/:id', isAdmin, updateUser);
router.delete('/users/:id', isAdmin, deleteUser);

export default router;
