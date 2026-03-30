import express from 'express';
import {
  getAllRests,
  getRestById,
  getRestByHref,
  createRest,
  updateRest,
  deleteRest,
  restoreRest,
  seedRestData
} from '../controllers/restController.js';

const router = express.Router();

// Routes العامة (لا تحتاج مصادقة)
router.get('/', getAllRests);                    // GET /api/rests - جميع الاستراحات
router.get('/seed', seedRestData);               // GET /api/rests/seed - إضافة بيانات العينة
router.get('/href/:href', getRestByHref);       // GET /api/rests/href/:href - استراحة بالرابط
router.get('/:id', getRestById);                // GET /api/rests/:id - استراحة واحدة

// Routes الإدارية (تحتاج مصادقة - يمكن إضافة middleware لاحقاً)
router.post('/', createRest);                   // POST /api/rests - إنشاء استراحة
router.put('/:id', updateRest);                 // PUT /api/rests/:id - تحديث استراحة
router.delete('/:id', deleteRest);              // DELETE /api/rests/:id - حذف استراحة
router.patch('/:id/restore', restoreRest);      // PATCH /api/rests/:id/restore - استعادة استراحة

export default router;
