import express from 'express';
import {
  addContactLink,
  deleteContactLink,
  getContactInfo,
  toggleContactInfoStatus,
  updateContactInfo,
  updateContactLink
} from '../controllers/contactInfoController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getContactInfo);

// Admin/Protected routes (require authentication)
router.put('/', isAdmin, updateContactInfo);
router.post('/links', isAdmin, addContactLink);
router.put('/links/:linkId', isAdmin, updateContactLink);
router.delete('/links/:linkId', isAdmin, deleteContactLink);
router.put('/status', isAdmin, toggleContactInfoStatus);

export default router;
