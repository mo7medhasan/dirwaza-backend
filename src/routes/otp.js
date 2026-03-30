import express from 'express';
import formData from 'express-form-data';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(formData.parse());

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

export default router;
