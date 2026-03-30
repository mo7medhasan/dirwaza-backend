import cors from 'cors';
import express from 'express';
import formData from 'express-form-data';
import helmet from 'helmet';
import { checkCode, login, logout, register, resendCode } from '../controllers/authController.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());
router.use(helmet());
router.use(formData.parse());
// تسجيل مستخدم جديد بعد التحقق من OTP
router.post('/register', register);
router.post('/login', login);
router.post('/check_code', checkCode);
router.post('/resend_code', resendCode);
router.post('/logout', logout);

export default router;
