import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import languageService from '../services/languageService.js';

dotenv.config();

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: languageService.getText('auth.tokenRequired', req.language)
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: languageService.getText('auth.invalidToken', req.language)
    });
  }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('user.notFound', req.language)
      });
    }

    // Format user data
    const userProfile = {
      name: user.name || '',
      phone: user.phone || '',
      image: user.image || '/icons/profile.svg',
      email: user.email || '',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: languageService.getText('user.profileRetrieved', req.language),
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('user.profileError', req.language),
      error: error.message
    });
  }
});

// Get user bookings
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const bookings = [];

    // Get rest bookings
    const restBookings = await Booking.find({ userId }).populate('experienceId');
    restBookings.forEach(booking => {
      if (booking.experienceId) {
        bookings.push({
          id: booking._id.toString(),
          title: booking.experienceId.title || booking.experienceId.titleEn || 'منتجع',
          location: booking.experienceId.location || 'اللؤلؤة، الدوحة',
          date: new Date(booking.date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: `من ${booking.startTime || '4:00 م'} إلى ${booking.endTime || '12:00 ص'}`,
          status: booking.status || 'confirmed',
          image: booking.experienceId.images?.[0] || '/images/resort1.jpg',
          type: 'rest'
        });
      }
    });

    // Get plant orders (operator bookings)
    const plantOrders = await Payment.find({ 
      userId, 
      paymentStatus: { $in: ['completed', 'pending'] },
      description: { $regex: /نبات|plant/i }
    });
    plantOrders.forEach(order => {
      const statusText = order.paymentStatus === 'completed' ? 'تم التوصيل' : 
                        order.paymentStatus === 'pending' ? 'قيد التوصيل' : 'طلب مؤكد';
      bookings.push({
        id: order._id.toString(),
        title: order.description || 'نباتات الزينة',
        location: 'مزرعة الدروازة',
        date: new Date(order.createdAt).toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: statusText,
        status: order.paymentStatus === 'completed' ? 'confirmed' : 'pending',
        image: '/images/plants/monstera.jpg',
        type: 'operator'
      });
    });

    // Get training bookings
    const trainingBookings = await Payment.find({ 
      userId, 
      paymentStatus: { $in: ['completed', 'pending'] },
      description: { $regex: /تدريب|training/i }
    });
    trainingBookings.forEach(training => {
      bookings.push({
        id: training._id.toString(),
        title: training.description || 'تدريب الأطفال',
        location: 'مزرعة الدروازة',
        date: new Date(training.createdAt).toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: 'من 3:00 م إلى 5:00 م',
        status: training.paymentStatus === 'completed' ? 'confirmed' : 'pending',
        image: '/images/service1.svg',
        type: 'training'
      });
    });

    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      message: languageService.getText('user.bookingsRetrieved', req.language),
      data: bookings
    });
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('user.bookingsError', req.language),
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, image } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('user.notFound', req.language)
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (image) user.image = image;

    await user.save();

    res.json({
      success: true,
      message: languageService.getText('user.profileUpdated', req.language),
      data: {
        name: user.name,
        email: user.email,
        image: user.image || '/icons/profile.svg'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('user.profileUpdateError', req.language),
      error: error.message
    });
  }
});

export default router;
