import { format } from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import Booking from '../models/Booking.js';
import Experience from '../models/Experience.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import languageService from '../services/languageService.js';

// Format date in Arabic
const formatArabicDate = (date) => {
  return format(new Date(date), 'd MMMM yyyy', { locale: arSA });
};

// Get dashboard statistics
export const getDashboardStatistics = async (req, res) => {
  try {
    // Get current month and previous month for comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all bookings
    const allBookings = await Booking.find({});
    const currentMonthBookings = await Booking.find({
      createdAt: { $gte: currentMonthStart }
    });
    const lastMonthBookings = await Booking.find({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Calculate statistics
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'confirmed').length;
    const cancelledBookings = allBookings.filter(b => b.bookingStatus === 'cancelled').length;
    const occupancyRate = Math.round((confirmedBookings / (totalBookings || 1)) * 100);
    
    // Calculate changes from last month
    const lastMonthConfirmed = lastMonthBookings.filter(b => b.bookingStatus === 'confirmed').length;
    const confirmedChange = lastMonthConfirmed > 0 
      ? Math.round(((confirmedBookings - lastMonthConfirmed) / lastMonthConfirmed) * 100)
      : 0;

    const lastMonthCancelled = lastMonthBookings.filter(b => b.bookingStatus === 'cancelled').length;
    const cancelledChange = lastMonthCancelled > 0
      ? Math.round(((cancelledBookings - lastMonthCancelled) / lastMonthCancelled) * 100)
      : 0;

    const response = {
      occupancyRate: {
        value: occupancyRate.toString(),
        change: `+${Math.abs(confirmedChange)}%`,
        changeType: confirmedChange >= 0 ? 'positive' : 'negative',
      },
      cancelledReservations: {
        value: cancelledBookings,
        change: `${cancelledChange >= 0 ? '+' : ''}${cancelledChange}%`,
        changeType: cancelledChange < 0 ? 'positive' : 'negative',
      },
      confirmedReservations: {
        value: confirmedBookings,
        change: `${confirmedChange >= 0 ? '+' : ''}${confirmedChange}%`,
        changeType: confirmedChange >= 0 ? 'positive' : 'negative',
      },
      totalReservations: {
        value: totalBookings,
        change: '+12%', // This would need actual calculation based on your business logic
        changeType: 'positive',
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get recent reservations
export const getRecentReservations = async (req, res) => {
  try {
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone')
      .populate('experienceId', 'title');

    const formattedBookings = recentBookings.map(booking => ({
      id: `RES-${booking._id.toString().substring(18, 24)}`,
      clientName: booking.userId?.name || 'مستخدم',
      clientPhone: booking.userId?.phone || 'غير متوفر',
      restName: booking.experienceId?.title || 'تجربة غير محددة',
      checkInDate: formatArabicDate(booking.date),
      checkInTime: booking.timeSlot?.split('-')[0] || '--:--',
      checkOutDate: formatArabicDate(booking.date),
      checkOutTime: booking.timeSlot?.split('-')[1] || '--:--',
      bookingType: booking.experienceType === 'overnight' ? 'withStay' : 'withoutStay',
      reservationStatus: booking.bookingStatus === 'confirmed' ? 'confirmed' : 
                        booking.bookingStatus === 'cancelled' ? 'cancelled' : 'pending',
      paymentStatus: booking.paymentStatus === 'paid' ? 'fullAmount' : 'halfAmount'
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error getting recent reservations:', error);
    res.status(500).json({ error: 'Failed to fetch recent reservations' });
  }
};
// Get booking statistics by experience type
export const getBookingStatsByType = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all experience types
    const experienceTypes = await Experience.find().select('type name nameAr -_id');
    
    // Get total bookings count for percentage calculation
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get bookings count by experience type
    const stats = await Promise.all(
      experienceTypes.map(async (exp) => {
        const count = await Booking.countDocuments({
          experienceType: exp.type,
          createdAt: { $gte: thirtyDaysAgo }
        });
        
        const percentage = totalBookings > 0 
          ? Math.round((count / totalBookings) * 100) 
          : 0;
        
        return {
          type: exp.type,
          name: req.language === 'ar' ? exp.nameAr : exp.name,
          count,
          percentage
        };
      })
    );
    
    // Sort by count in descending order
    stats.sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      message: languageService.getText('dashboard.bookingStats.retrieved', req.language),
      data: stats
    });
  } catch (error) {
    console.error('Error getting booking stats by type:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('dashboard.bookingStats.error', req.language)
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Equestrian bookings (scheduled)
    const equestrianBookings = await Booking.countDocuments({
      status: 'confirmed',
      experienceType: 'equestrian'
    });

    const lastMonthEquestrian = await Booking.countDocuments({
      status: 'confirmed',
      experienceType: 'equestrian',
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // 2. Rest bookings (booked today)
    const restBookingsToday = await Booking.countDocuments({
      experienceType: 'rest',
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // 3. Plant orders (nursery orders)
    const plantOrders = await Payment.countDocuments({
      type: { $regex: /plant/i },
      status: 'completed'
    });

    const lastMonthPlantOrders = await Payment.countDocuments({
      type: { $regex: /plant/i },
      status: 'completed',
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // 4. Shipments (delivery status)
    const shipmentsInDelivery = await Payment.countDocuments({
      status: 'completed',
      deliveryStatus: 'in_delivery'
    });

    // Calculate percentage changes
    const equestrianChange = lastMonthEquestrian > 0 
      ? ((equestrianBookings - lastMonthEquestrian) / lastMonthEquestrian * 100).toFixed(0)
      : 0;

    const plantOrdersChange = lastMonthPlantOrders > 0
      ? ((plantOrders - lastMonthPlantOrders) / lastMonthPlantOrders * 100).toFixed(0)
      : 0;

    // Additional stats
    const totalUsers = await User.countDocuments();
    const totalExperiences = await Experience.countDocuments({ isActive: true });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenueAmount = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const stats = {
      equestrianBookings: {
        count: equestrianBookings,
        label: 'حجوزات الفروسية',
        labelEn: 'Equestrian Bookings',
        status: 'مجدولة',
        statusEn: 'Scheduled',
        change: equestrianChange,
        icon: 'calendar',
        color: 'amber'
      },
      restBookings: {
        count: restBookingsToday,
        label: 'حجوزات الاستراحات',
        labelEn: 'Rest Bookings',
        status: 'حجز اليوم',
        statusEn: 'Booked Today',
        change: 0,
        icon: 'home',
        color: 'amber'
      },
      shipments: {
        count: shipmentsInDelivery,
        label: 'الشحنات',
        labelEn: 'Shipments',
        status: 'في التوصيل',
        statusEn: 'In Delivery',
        change: 0,
        icon: 'truck',
        color: 'amber'
      },
      plantOrders: {
        count: plantOrders,
        label: 'طلبات المشتل',
        labelEn: 'Nursery Orders',
        status: 'طلب جديد',
        statusEn: 'New Order',
        change: plantOrdersChange,
        icon: 'shopping-cart',
        color: 'amber'
      },
      summary: {
        totalUsers,
        totalExperiences,
        totalRevenue: revenueAmount,
        currency: 'SAR'
      }
    };

    res.json({
      success: true,
      message: languageService.getText('dashboard.stats.retrieved', req.language),
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('dashboard.stats.error', req.language),
      error: error.message
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('experienceId', 'name nameAr')
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent payments
    const recentPayments = await Payment.find()
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit);

    const activities = [
      ...recentBookings.map(booking => ({
        id: booking._id,
        type: 'booking',
        title: booking.experienceId?.name || 'Unknown Experience',
        titleAr: booking.experienceId?.nameAr || 'تجربة غير معروفة',
        user: booking.userId?.name || 'Unknown User',
        phone: booking.userId?.phone,
        status: booking.status,
        amount: booking.totalAmount,
        createdAt: booking.createdAt
      })),
      ...recentPayments.map(payment => ({
        id: payment._id,
        type: 'payment',
        title: payment.type,
        titleAr: payment.type,
        user: payment.userId?.name || 'Unknown User',
        phone: payment.userId?.phone,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt
      }))
    ];

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      message: languageService.getText('dashboard.activities.retrieved', req.language),
      data: limitedActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('dashboard.activities.error', req.language),
      error: error.message
    });
  }
};

// Get revenue analytics
// Get all payments with pagination and filters
export const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build filter object
    const filter = {};
    
    // Filter by payment status
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    
    // Filter by payment method
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Search by customer name or ID (if you have this field)
    if (req.query.search) {
      // This assumes you have a reference to the User model
      const users = await User.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');
      
      if (users.length > 0) {
        filter.userId = { $in: users.map(u => u._id) };
      }
    }
    
    // Get total count for pagination
    const total = await Payment.countDocuments(filter);
    
    // Get paginated payments
    const payments = await Payment.find(filter)
      .populate('userId', 'name email phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format the response to match the table in the image
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      date: payment.createdAt.toISOString().split('T')[0],
      customer: payment.userId?.name || 'Guest',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'N/A',
      status: payment.paymentStatus,
      invoice: payment.uuid || ''
    }));
    
    res.json({
      success: true,
      message: languageService.getText('dashboard.payments.retrieved', req.language),
      data: {
        payments: formattedPayments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('dashboard.payments.error', req.language),
      error: error.message
    });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        endDate = new Date();
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalTransactions = revenueData.reduce((sum, item) => sum + item.count, 0);

    res.json({
      success: true,
      message: languageService.getText('dashboard.revenue.retrieved', req.language),
      data: {
        period,
        totalRevenue,
        totalTransactions,
        currency: 'SAR',
        chartData: revenueData.map(item => ({
          date: new Date(item._id.year, item._id.month - 1, item._id.day),
          revenue: item.totalRevenue,
          transactions: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('dashboard.revenue.error', req.language),
      error: error.message
    });
  }
};
