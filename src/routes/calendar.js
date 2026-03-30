import express from 'express';
import {
  addDisabledDate,
  checkDateAvailability,
  createOrUpdateCalendar,
  deleteCalendar,
  getAllCalendars,
  getCalendarData,
  removeDisabledDate,
  updatePrices
} from '../controllers/calendarController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllCalendars);                                    // GET all calendars
router.get('/:experienceId', getCalendarData);                       // GET calendar for specific experience
router.get('/:experienceId/check-date/:date', checkDateAvailability); // Check date availability

// Protected routes (require authentication)
router.post('/', createOrUpdateCalendar);                            // CREATE/UPDATE calendar
router.put('/:id/prices', updatePrices);                            // UPDATE prices only
router.post('/:id/disabled-dates', addDisabledDate);                // ADD disabled date
router.delete('/:id/disabled-dates/:dateId', removeDisabledDate);   // REMOVE disabled date
router.delete('/:id', deleteCalendar);                              // DELETE calendar

export default router;
