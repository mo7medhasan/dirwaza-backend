import express from 'express';
import { cancelBooking, createBooking, createBookingHorse, createBookingPlants, createBookingRest, deleteBooking, exportBookingsToExcel, exportBookingsToPDF, getAllHorseBookings, getAllRestBookings, getBookingById, getBookings, getFinanceData, getHorseDisabledDates, getRestDisabledDates, updateBooking } from '../controllers/bookingsController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// formData.parse() middleware removed from global use to prevent GET request issues

// GET /api/bookings/export/excel
router.get('/export/excel', isAdmin, exportBookingsToExcel);
// GET /api/bookings/export/pdf
router.get('/export/pdf', isAdmin, exportBookingsToPDF);

// GET /api/bookings/finance
router.get('/finance', isAdmin, getFinanceData);

// GET /api/bookings
router.get('/', isAdmin, getBookings);

// GET /api/bookings/rest/all - Get all rest bookings
router.get('/rest/all', isAdmin, getAllRestBookings);

// GET /api/bookings/horse/all - Get all horse training bookings
router.get('/horse/all', isAdmin, getAllHorseBookings);

// GET /api/bookings/rest/:restId/disabled-dates - Get disabled dates for rest
router.get('/rest/:restId/disabled-dates', getRestDisabledDates);

// GET /api/bookings/horse/:experienceId/disabled-dates - Get disabled dates for horse training
router.get('/horse/:experienceId/disabled-dates', getHorseDisabledDates);

// تفاصيل وتعديل وحذف حجز (للأدمن)
router.get('/:id', isAdmin, getBookingById);
router.put('/:id', isAdmin, updateBooking);
router.delete('/:id', isAdmin, deleteBooking);

// POST /api/bookings
router.post('/', createBooking);

// POST /api/bookings/rest - Create rest booking
router.post('/rest', createBookingRest);

// POST /api/bookings/horse - Create horse training booking
router.post('/horse', createBookingHorse);

// POST /api/bookings/plants - Create plant order booking
router.post('/plants', createBookingPlants);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', isAdmin, cancelBooking);

export default router;
