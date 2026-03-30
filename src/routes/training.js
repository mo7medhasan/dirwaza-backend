import express from 'express';
import {
  addDisabledDate,
  createOrUpdateTraining,
  getAllTrainings,
  getAvailableDates,
  getTrainingById,
  removeDisabledDate,
  toggleTrainingStatus
} from '../controllers/trainingController.js';

const router = express.Router();

// Public routes
router.get('/', getAllTrainings);
router.get('/available-dates', getAvailableDates);

// Protected routes
router.use((req, res, next) => {
  // Add authentication middleware here
  next();
});

router.get('/:id', getTrainingById);
router.post('/', createOrUpdateTraining);
router.put('/:id', createOrUpdateTraining);
router.put('/:id/status', toggleTrainingStatus);
router.post('/:id/disabled-dates', addDisabledDate);
router.delete('/:id/disabled-dates/:date', removeDisabledDate);

export default router;
