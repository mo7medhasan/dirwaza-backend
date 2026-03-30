import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getRevenueAnalytics,
  getAllPayments,
  getBookingStatsByType
} from '../controllers/dashboardController.js';
import { isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Dashboard statistics
router.get('/stats', isAdmin, getDashboardStats);

// Recent activities
router.get('/activities', isAdmin, getRecentActivities);

// Revenue analytics
router.get('/revenue', isAdmin, getRevenueAnalytics);

// Get all payments
router.get('/payments', isAdmin, getAllPayments);

// Get booking statistics by experience type
router.get('/booking-stats', isAdmin, getBookingStatsByType);

export default router;
