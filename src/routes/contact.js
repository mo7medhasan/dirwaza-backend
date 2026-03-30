import express from 'express';
import formData from 'express-form-data';
import { sendContactMessage, getAllContacts, deleteContact } from '../controllers/contactController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(formData.parse());

// إرسال رسالة تواصل (مفتوح)
router.post('/', sendContactMessage);
// جلب جميع الرسائل (للأدمن)
router.get('/', isAdmin, getAllContacts);
// حذف رسالة (للأدمن)
router.delete('/:id', isAdmin, deleteContact);

export default router;
