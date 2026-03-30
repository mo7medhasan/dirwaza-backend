import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.js';
import Experience from '../models/Experience.js';
import Rest from '../models/Rest.js';
import Training from '../models/Training.js';
import User from '../models/User.js';
import languageService from '../services/languageService.js';
import noqoodyPay from '../services/paymentService.js';
import {
  notifyAdminBookingCancellation,
  notifyAdminBookingUpdate,
  notifyAdminNewBooking,
  sendBookingConfirmation
} from '../services/whatsappService.js';

// Utility: Format date in Arabic
function formatArabicDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

// GET /api/bookings/finance
export const getFinanceData = async (req, res) => {
  try {
    const match = {};
    if (req.query.status) match.bookingStatus = req.query.status;
    if (req.query.paymentStatus) match.paymentStatus = req.query.paymentStatus;
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from);
      if (req.query.to) match.date.$lte = new Date(req.query.to);
    }
    const result = await Booking.aggregate([
      { $match: match },
      { $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          totalBookings: { $sum: 1 }
      }}
    ]);
    const data = result[0] || { totalSales: 0, totalBookings: 0 };
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات المالية', error: error.message });
  }
};

// NoqoodyPay Webhook handler (supports GET/POST, reads reference from query/body)
export const noqoodyWebhookHandler = async (req, res) => {
  try {
    const reference = req.query.reference || req.body.reference || req.body.ReferenceNo;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Missing payment reference in webhook.' });
    }

    // Revalidate with Noqoody
    const response = await axios.get(
      `https://www.noqoodypay.com/sdk/api/Members/GetTransactionDetailStatusByClientReference/?ReferenceNo=${reference}`
    );
    const { success, status } = response.data || {};

    // Update booking by paymentReference
    const booking = await Booking.findOne({ paymentReference: reference });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'الحجز غير موجود لهذا المرجع' });
    }

    if (success) {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
    } else if (status === 'Pending') {
      booking.paymentStatus = 'pending';
    } else {
      booking.paymentStatus = 'failed';
    }
    await booking.save();

    return res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      bookingId: booking._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error processing NoqoodyPay webhook', error: error.message });
  }
};

// GET /api/bookings/export/excel
export const exportBookingsToExcel = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.bookingStatus = req.query.status;
    if (req.query.experienceId) filter.experienceId = req.query.experienceId;
    if (req.query.date) filter.date = new Date(req.query.date);
    const bookings = await Booking.find(filter).populate('experienceId');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');
    worksheet.columns = [
      { header: 'رقم الحجز', key: '_id', width: 26 },
      { header: 'العميل', key: 'userName', width: 20 },
      { header: 'الجوال', key: 'userPhone', width: 16 },
      { header: 'البريد', key: 'userEmail', width: 24 },
      { header: 'التجربة', key: 'experienceTitle', width: 20 },
      { header: 'النوع', key: 'experienceType', width: 14 },
      { header: 'التاريخ', key: 'date', width: 14 },
      { header: 'الفترة', key: 'timeSlot', width: 12 },
      { header: 'المبلغ', key: 'amount', width: 10 },
      { header: 'الحالة', key: 'bookingStatus', width: 12 },
      { header: 'الدفع', key: 'paymentStatus', width: 12 },
    ];
    bookings.forEach(b => {
      worksheet.addRow({
        _id: b._id.toString(),
        userName: b.userName,
        userPhone: b.userPhone,
        userEmail: b.userEmail,
        experienceTitle: b.experienceId?.title || '',
        experienceType: b.experienceType,
        date: b.date ? new Date(b.date).toLocaleDateString('ar-EG') : '',
        timeSlot: b.timeSlot,
        amount: b.amount,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تصدير البيانات إلى Excel', error: error.message });
  }
};

// GET /api/bookings/export/pdf
export const exportBookingsToPDF = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.bookingStatus = req.query.status;
    if (req.query.experienceId) filter.experienceId = req.query.experienceId;
    if (req.query.date) filter.date = new Date(req.query.date);
    const bookings = await Booking.find(filter).populate('experienceId');

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.pdf"');
    doc.pipe(res);
    doc.fontSize(16).text('تقرير الحجوزات', { align: 'center' });
    doc.moveDown();
    const tableHeaders = ['رقم الحجز', 'العميل', 'الجوال', 'البريد', 'التجربة', 'النوع', 'التاريخ', 'الفترة', 'المبلغ', 'الحالة', 'الدفع'];
    doc.fontSize(10);
    doc.text(tableHeaders.join(' | '), { align: 'right' });
    doc.moveDown(0.5);
    bookings.forEach(b => {
      const row = [
        b._id.toString(),
        b.userName,
        b.userPhone,
        b.userEmail,
        b.experienceId?.title || '',
        b.experienceType,
        b.date ? new Date(b.date).toLocaleDateString('ar-EG') : '',
        b.timeSlot,
        b.amount,
        b.bookingStatus,
        b.paymentStatus
      ];
      doc.text(row.join(' | '), { align: 'right' });
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تصدير البيانات إلى PDF', error: error.message });
  }
};

// GET /api/bookings
export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.bookingStatus = req.query.status;
    if (req.query.experienceId) filter.experienceId = req.query.experienceId;
    if (req.query.date) filter.date = new Date(req.query.date);
    const bookings = await Booking.find(filter)
      .populate('experienceId')
      .populate('userId', 'name phone email');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الحجوزات', error: error.message });
  }
};

// GET /api/bookings/:id (جلب تفاصيل حجز)
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'الحجز غير موجود' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الحجز', error: error.message });
  }
};

// PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    // حفظ القيم القديمة للإشعار
    const oldValues = {
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus
    };

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = cancellationReason;
    await booking.save();

    // إرسال إشعار للإدارة بالإلغاء
    const populatedBooking = await Booking.findById(booking._id)
      .populate('experienceId')
      .populate('userId', 'name phone email');
    await notifyAdminBookingCancellation(populatedBooking);
    await notifyAdminBookingUpdate(populatedBooking, oldValues);

    res.json({ message: 'تم إلغاء الحجز بنجاح', booking: populatedBooking });
  } catch (error) {
    console.error('خطأ في إلغاء الحجز:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إلغاء الحجز', error: error.message });
  }
};

import Log from '../models/Log.js';
// PUT /api/bookings/:id (تعديل حجز)
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // الحصول على الحجز القديم
    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    // تحديث الحجز
    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });
    
    // إرسال إشعار للإدارة بالتحديث
    const populatedBooking = await Booking.findById(booking._id)
      .populate('experienceId')
      .populate('userId', 'name phone email');
    await notifyAdminBookingUpdate(populatedBooking, {
      bookingStatus: oldBooking.bookingStatus,
      paymentStatus: oldBooking.paymentStatus,
      date: oldBooking.date,
      timeSlot: oldBooking.timeSlot
    });

    res.json({ message: 'تم تحديث الحجز بنجاح', booking: populatedBooking });
  } catch (error) {
    console.error('خطأ في تحديث الحجز:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث الحجز', error: error.message });
  }
};

// DELETE /api/bookings/:id (حذف حجز)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'الحجز غير موجود' });
    // سجل الحذف
    await Log.create({
      action: 'delete',
      entity: 'booking',
      entityId: booking._id,
      before: booking.toObject(),
      performedBy: req.user?.id || 'unknown',
      performedById: req.user?.id || undefined
    });
    res.json({ message: 'تم حذف الحجز بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الحجز', error: error.message });
  }
};

// Helper function to handle user creation/update
const handleUserForBooking = async (phone, name, email) => {
  // البحث عن المستخدم بناءً على رقم الهاتف
  let user = await User.findOne({ phone });
  
  if (user) {
    // إذا كان المستخدم موجود، تحديث البيانات
    console.log(`المستخدم موجود بالفعل: ${user._id}`);
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    console.log(`تم تحديث بيانات المستخدم: ${user.name}`);
  } else {
    // إذا لم يكن المستخدم موجود، إنشاء مستخدم جديد
    console.log(`إنشاء مستخدم جديد لرقم: ${phone}`);
    const uniqueId = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const uniqueName = name || `user_${uniqueId}`;
    
    user = await User.create({
      phone,
      name: uniqueName,
      email: email || undefined,
      isActive: true
    });
    console.log(`تم إنشاء مستخدم جديد: ${user._id} - ${user.name}`);
  }
  
  return user;
};

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { 
      experienceId, 
      date, 
      timeSlot, 
      userName, 
      userPhone, 
      userEmail, 
      experienceType, 
      amount,
      notes 
    } = req.body;

    // Basic validation
    if (!experienceId || !date || !timeSlot) {
      return res.status(400).json({ 
        success: false,
        message: 'الرجاء إدخال جميع الحقول المطلوبة' 
      });
    }

    let user;
    
    // Check if user is authenticated via token
    if (req.user) {
      // Use the authenticated user
      user = req.user;
    } 
    // If not authenticated but phone is provided, find or create user
    else if (userPhone) {
      user = await User.findOneAndUpdate(
        { phone: userPhone },
        { 
          $setOnInsert: { 
            name: userName || 'مستخدم جديد',
            email: userEmail || '',
            isActive: true
          }
        },
        { 
          upsert: true,
          new: true,
          setDefaultsOnInsert: true 
        }
      );
    } 
    // No user info provided
    else {
      return res.status(400).json({ 
        success: false,
        message: 'يجب تسجيل الدخول أو توفير رقم الهاتف' 
      });
    }

    // Check for existing booking at the same time
    const existingBooking = await Booking.findOne({ 
      experienceId,
      date: new Date(date),
      timeSlot,
      bookingStatus: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ 
        success: false,
        message: 'يوجد حجز آخر لنفس التجربة في نفس التاريخ والفترة الزمنية' 
      });
    }

    // Create the booking
    const booking = new Booking({
      userId: req.user.id,
      userName: user.name || userName,
      userPhone: req.user.phone,
      userEmail: user.email || userEmail || '',
      experienceType,
      experienceId,
      date: new Date(date),
      timeSlot,
      amount,
      notes,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });

    await booking.save();
    
    // Get experience details for notification
    const experience = await Experience.findById(experienceId);
    
    // Send confirmation to client if phone is available
    const phoneToNotify = user.phone || userPhone;
    if (phoneToNotify) {
      await sendBookingConfirmation({
        phone: phoneToNotify.startsWith('+') ? phoneToNotify : `+${phoneToNotify}`,
        bookingId: booking._id,
        experienceName: experience?.title || 'خدمة',
        date: booking.date,
        timeSlot: booking.timeSlot
      });
    }
    
    // Notify admin
    const populatedBooking = await Booking.findById(booking._id)
      .populate('experienceId')
      .populate('userId', 'name phone email');
    await notifyAdminNewBooking(populatedBooking);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحجز بنجاح',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحجز',
      error: error.message 
    });
  }
};

// Verify and update payment status with NoqoodyPay
import axios from 'axios';

export const verifyAndUpdateNoqoodyPayment = async (req, res) => {
  const { referenceNo } = req.params;
  try {
    // 1. Call NoqoodyPay API
    const response = await axios.get(
      `https://www.noqoodypay.com/sdk/api/Members/GetTransactionDetailStatusByClientReference/?ReferenceNo=${referenceNo}`
    );
    const { success, status, ...rest } = response.data;

    // 2. Find booking by paymentReference
    const booking = await Booking.findOne({ paymentReference: referenceNo });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'الحجز غير موجود لهذا المرجع' });
    }

    // 3. Update booking/payment status based on NoqoodyPay result
    if (success) {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
    } else if (status === 'Pending') {
      booking.paymentStatus = 'pending';
    } else {
      booking.paymentStatus = 'failed';
    }
    await booking.save();

    // 4. Respond with updated booking and payment status
    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      booking,
      noqoodyResponse: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء التحقق من حالة الدفع وتحديث الحجز',
      error: error.message
    });
  }
};

// POST /api/bookings/rest
export const createBookingRest = async (req, res) => {
  try {
    const { 
      fullName,
      email,
      phone,
      cardDetails,
      paymentAmount, // 'partial' or 'full'
      paymentMethod, // 'card'
      totalPrice,
      totalPaid,
      overnight, // boolean
      checkIn, // array of dates
      restId
    } = req.body;

    // Basic validation
    if (!fullName || !phone || !restId || !checkIn || !Array.isArray(checkIn) || checkIn.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'الرجاء إدخال جميع الحقول المطلوبة (الاسم، الهاتف، معرف الاستراحة، تواريخ الحجز)' 
      });
    }

    // Validate rest exists
    if (!mongoose.Types.ObjectId.isValid(restId)) {
      return res.status(400).json({ 
        success: false,
        message: 'معرف الاستراحة غير صحيح' 
      });
    }
    
    const rest = await Rest.findById(restId);
    if (!rest) {
      return res.status(404).json({ 
        success: false,
        message: 'الاستراحة المحددة غير موجودة' 
      });
    }

    // Find or create user by phone
    const normalizedPhone = phone.replace(/^0/, '+966');
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      // Create new user
      user = new User({
        name: fullName,
        phone: normalizedPhone,
        email: email || '',
        isActive: true
      });
      await user.save();
    }
    // If user exists, use existing user without updating to avoid conflicts

    // Check for existing booking conflicts
    const checkInDates = checkIn.map(date => new Date(date));
    const existingBooking = await Booking.findOne({ 
      restId,
      date: { $in: checkInDates },
      bookingStatus: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ 
        success: false,
        message: 'يوجد حجز آخر لنفس الاستراحة في أحد التواريخ المحددة' 
      });
    }

    // Create the rest booking
    const booking = new Booking({
      userId: user._id,
      userName: fullName,
      userPhone: phone,
      userEmail: email || '',
      experienceType: overnight ? 'overnight' : 'day_visit',
      restId: restId,
      date: checkInDates[0], // Primary check-in date
      checkInDates: checkInDates, // All check-in dates
      totalPrice: totalPrice,
      totalPaid: totalPaid,
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentAmount === 'full' ? 'paid' : 'partially_paid',
      bookingStatus: 'confirmed',
      cardDetails: {
        lastFourDigits: cardDetails?.cardNumber ? cardDetails.cardNumber.slice(-4) : '',
        // Don't store full card details for security
      },
      bookingType: 'rest'
    });

    await booking.save();
    
    // Generate payment link using payment service
    let paymentUrl = null;
    let paymentReference = null;
    let paymentId = null;
    
    try {
      const paymentData = {
        amount: totalPrice,
        description: `حجز استراحة - ${rest.name || 'استراحة'} - ${overnight ? 'مبيت' : 'زيارة يومية'}`,
        customerName: fullName,
        customerEmail: email || '',
        customerPhone: normalizedPhone,
        orderType: 'rest',
        bookingId: booking._id.toString()
      };
      
      const paymentResult = await noqoodyPay.generatePaymentLink(paymentData);
      
      if (paymentResult.success) {
        paymentUrl = paymentResult.paymentUrl;
        paymentReference = paymentResult.reference;
        paymentId = paymentResult.paymentId;
        
        // Update booking with payment reference
        booking.paymentReference = paymentReference;
        booking.paymentStatus = 'pending'; // Change to pending until payment is completed
        await booking.save();
      }
    } catch (paymentError) {
      console.error('Error generating payment link:', paymentError);
      // Continue without payment link - booking is still created
    }
    
    // Get the saved booking for response
    const savedBooking = await Booking.findById(booking._id);

    // Prepare paymentDetails (invoice style)
    const sortedCheckInDates = Array.isArray(savedBooking.checkInDates)
      ? savedBooking.checkInDates.sort((a, b) => new Date(a) - new Date(b))
      : [];
    const deliveryDate = sortedCheckInDates.length > 0 ? sortedCheckInDates[0] : null;
    const completionDate = sortedCheckInDates.length > 0 ? sortedCheckInDates[sortedCheckInDates.length - 1] : null;
    function formatArabicAmount(amount) {
      if (!amount) return "";
      return `${amount.toLocaleString("ar-EG")} ريال قطري`;
    }
    function getArabicPaymentStatus(status) {
      if (status === "paid") return "تم الدفع بالكامل";
      if (status === "partially_paid") return "دفعة جزئية";
      return "لم يتم الدفع";
    }
    const paymentDetails = {
      order_ids: savedBooking.order_id,
      propertyType: rest.title || rest.name || "",
      propertyLocation: savedBooking.experienceType === "overnight" ? "مع مبيت" : "بدون مبيت",
      namePerson: savedBooking.userName || "",
      deliveryDate: formatArabicDate(deliveryDate),
      completionDate: formatArabicDate(completionDate),
      totalAmount: formatArabicAmount(savedBooking.totalPrice),
      amountDetails: getArabicPaymentStatus(savedBooking.paymentStatus),
      orderNumber: savedBooking.order_id
    };

    res.status(201).json({
      success: true,
      message: 'تم إنشاء حجز الاستراحة بنجاح',
      booking: savedBooking,
      order_id: savedBooking.order_id,
      paymentDetails,
      paymentUrl: paymentUrl,
      paymentReference: paymentReference,
      paymentId: paymentId,
      paymentMessage: paymentUrl ? 'تم إنشاء رابط الدفع بنجاح' : 'تم إنشاء الحجز بنجاح - يرجى المتابعة مع خدمة العملاء للدفع'
    });

  } catch (error) {
    console.error('Error creating rest booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء حجز الاستراحة',
      error: error.message 
    });
  }
};

// POST /api/bookings/horse
export const createBookingHorse = async (req, res) => {
  try {
    const { 
      agreedToTerms,
      personalInfo: {
        fullName,
        parentName,
        age,
        mobileNumber,
        previousTraining,
        notes
      },
      numberPersons,
      selectedCategoryId,
      selectedCourseId, // This is experienceId
      selectedAppointments
    } = req.body;

    // Basic validation
    if (!agreedToTerms) {
      return res.status(400).json({ 
        success: false,
        message: 'يجب الموافقة على الشروط والأحكام' 
      });
    }

    if (!fullName || !mobileNumber || !selectedCourseId) {
      return res.status(400).json({ 
        success: false,
        message: 'الرجاء إدخال جميع الحقول المطلوبة (الاسم، رقم الهاتف، الدورة المحددة)' 
      });
    }

    if (!selectedAppointments || selectedAppointments.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'الرجاء اختيار موعد واحد على الأقل' 
      });
    }

    // Validate Course in Training exists
    const training = await Training.findOne({ category: selectedCategoryId }); 
    if (!training) {
      return res.status(404).json({ 
        success: false,
        message: 'فئة التدريب غير موجودة' 
      });
    }
    
    const course = training.courses.find(c => c.id === selectedCourseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'الدورة المحددة غير موجودة في هذه الفئة',
        availableCourses: training.courses.map(c => ({ id: c.id, name: c.name }))
      });
    }

    // Find or create user by phone
    const normalizedPhone = mobileNumber.replace(/^0/, '+966');
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      // Create new user
      user = new User({
        name: fullName,
        phone: normalizedPhone,
        isActive: true
      });
      await user.save();
    }
    // If user exists, use existing user without updating to avoid conflicts

    // Check for existing booking conflicts for each appointment
    for (const appointment of selectedAppointments) {
      const existingBooking = await Booking.findOne({ 
        'horseTrainingDetails.selectedCategoryId': selectedCategoryId,
        experienceId: selectedCourseId, // This now stores the course ID
        date: new Date(appointment.date),
        timeSlot: appointment.timeSlot,
        bookingStatus: { $ne: 'cancelled' }
      });

      if (existingBooking) {
        return res.status(409).json({ 
          success: false,
          message: `يوجد حجز آخر لنفس الدورة في تاريخ ${appointment.date} والفترة ${appointment.timeSlot}` 
        });
      }
    }

    // Create bookings for each selected appointment
    const bookings = [];
    for (const appointment of selectedAppointments) {
      const booking = new Booking({
        userId: user._id,
        userName: fullName,
        userPhone: mobileNumber,
        userEmail: user.email || '',
        experienceType: 'training',
        experienceId: selectedCourseId,
        date: new Date(appointment.date),
        timeSlot: appointment.timeSlot,
        amount: course.price,
        notes: notes || '',
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        bookingType: 'horse_training',
        horseTrainingDetails: {
          parentName: parentName,
          age: parseInt(age),
          previousTraining: previousTraining,
          numberPersons: numberPersons,
          selectedCategoryId: selectedCategoryId,
          agreedToTerms: agreedToTerms
        }
      });

      await booking.save();
      // Set order_id after booking is saved
      booking.order_id = `DIRW-${booking._id.toString().slice(-6)}-${Date.now()}`;
      await booking.save();
      bookings.push(booking);
    }
    
    // Generate payment link for all bookings
    let paymentUrl = null;
    let paymentReference = null;
    let paymentId = null;
    const totalAmount = bookings.length * course.price;
    
    try {
      const paymentData = {
        amount: totalAmount,
        description: `حجز تدريب فروسية - ${course.name || 'تدريب الفروسية'} - ${bookings.length} جلسة`,
        customerName: fullName,
        customerEmail: user.email || '',
        customerPhone: normalizedPhone,
        orderType: 'horse_training',
        bookingId: bookings.map(b => b._id.toString()).join(',')
      };
      
      const paymentResult = await noqoodyPay.generatePaymentLink(paymentData);
      
      if (paymentResult.success) {
        paymentUrl = paymentResult.paymentUrl;
        paymentReference = paymentResult.reference;
        paymentId = paymentResult.paymentId;
        
        // Update all bookings with payment reference
        for (const booking of bookings) {
          booking.paymentReference = paymentReference;
          booking.paymentStatus = 'pending'; // Change to pending until payment is completed
          booking.totalPrice = totalAmount; // Set total amount for all sessions
          await booking.save();
        }
      }
    } catch (paymentError) {
      console.error('❌ Error generating payment link:', {
        message: paymentError.message,
        stack: paymentError.stack,
        paymentData: {
          amount: totalAmount,
          customerName: fullName,
          customerPhone: normalizedPhone
        }
      });
      // Continue without payment link - bookings are still created
    }
    
    // Send confirmation to client
    if (mobileNumber) {
      const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+966${mobileNumber.replace(/^0/, '')}`;
      await sendBookingConfirmation({
        phone: formattedPhone,
        bookingId: bookings[0]._id,
        experienceName: course.name || 'تدريب الفروسية',
        date: bookings[0].date,
        timeSlot: bookings[0].timeSlot,
        appointmentsCount: bookings.length
      });
    }
    
    // Notify admin for each booking
    for (const booking of bookings) {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('experienceId')
        .populate('userId', 'name phone email');
      await notifyAdminNewBooking(populatedBooking);
    }

    // Construct bookingData array for frontend
    const bookingData = bookings.map((booking) => ({
      trainerName: course.trainerName || "",
      sessionType: course.name || "",
      time: booking.timeSlot || "",
      sessionDate: formatArabicDate(booking.date),
      price: booking.amount ? booking.amount.toString() : "",
      order_id: booking.order_id || null
    }));

    res.status(201).json({
      success: true,
      message: `تم إنشاء ${bookings.length} حجز لتدريب الفروسية بنجاح`,
      bookings: bookings,
      order_ids: bookings.map(b => b.order_id),
      totalBookings: bookings.length,
      totalAmount: totalAmount,
      paymentUrl: paymentUrl,
      paymentReference: paymentReference,
      paymentId: paymentId,
      paymentMessage: paymentUrl
        ? "تم إنشاء رابط الدفع بنجاح"
        : "تم إنشاء الحجز بنجاح - يرجى المتابعة مع خدمة العملاء للدفع",
      bookingData: bookingData,
    });

  } catch (error) {
    console.error('Error creating horse training booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء حجز تدريب الفروسية',
      error: error.message 
    });
  }
};

// POST /api/bookings/plants
export const createBookingPlants = async (req, res) => {
  try {
    const {
      agreedToTerms,
      personalInfo: {
        fullName,
        mobileNumber,
        notes
      },
      recipientPerson,
      deliveryAddress,
      orderData,
      paymentMethod = 'card'
    } = req.body;

    // Basic validation
    if (!agreedToTerms) {
      return res.status(400).json({ success: false, message: 'يجب الموافقة على الشروط والأحكام' });
    }

    if (!fullName || !mobileNumber || !orderData || !Array.isArray(orderData) || orderData.length === 0) {
      return res.status(400).json({ success: false, message: 'الرجاء إدخال جميع الحقول المطلوبة (الاسم الكامل، رقم الهاتف، بيانات الطلب)' });
    }

    if (!recipientPerson?.fullName || !deliveryAddress?.city || !deliveryAddress?.district) {
      return res.status(400).json({ success: false, message: 'الرجاء إدخال جميع بيانات التوصيل المطلوبة (اسم المستلم، المدينة، الحي)' });
    }

    // Accept KSA, Egypt, Qatar. Normalize if needed.
    let normalizedPhone = mobileNumber.trim();
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
      // Local KSA mobile, convert to +966
      normalizedPhone = '+966' + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('01') && normalizedPhone.length === 11) {
      // Local Egypt mobile, convert to +20
      normalizedPhone = '+20' + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('9') && (normalizedPhone.length === 8 || normalizedPhone.length === 9)) {
      // Local Qatar, convert to +974
      normalizedPhone = '+974' + normalizedPhone;
    }
    // Accept +9665XXXXXXXX, +20XXXXXXXXXX, +974XXXXXXXX
    const phoneRegex = /^(\+9665\d{8}|\+20\d{10}|\+974\d{8,9})$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
    }

    // Find or create user
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      // Generate a default email if not provided
      const defaultEmail = `${normalizedPhone.replace('+', '').replace(/\D/g, '')}@dirwaza.com`;
      user = new User({ 
        name: fullName, 
        phone: normalizedPhone, 
        email: defaultEmail,
        isActive: true 
      });
      await user.save();
    } else if (!user.email) {
      // Update existing user with default email if missing
      const defaultEmail = `${normalizedPhone.replace('+', '').replace(/\D/g, '')}@dirwaza.com`;
      user.email = defaultEmail;
      await user.save();
    }

    // Fetch Plant Names from DB
    const PlantModule = await import('../models/Plant.js');
    const Plant = PlantModule.default;
    const plantIds = orderData.map(item => item.plantId);
    const plants = await Plant.find({ _id: { $in: plantIds } });

    const orderItems = orderData.map(item => {
      const plant = plants.find(p => p._id.toString() === item.plantId);
      const unitPrice = typeof item.unitPrice !== 'undefined'
        ? Number(item.unitPrice)
        : typeof item.price !== 'undefined'
          ? Number(item.price)
          : 0;
      const quantity = Number(item.quantity) || 0;
      return {
        plantId: item.plantId,
        name: plant ? plant.name : 'منتج غير معروف',
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity
      };
    });

    const totalPrice = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create Booking
    const booking = new Booking({
      userId: user._id,
      userName: fullName,
      userPhone: normalizedPhone,
      userEmail: user.email || '',
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      experienceType: 'delivery',
      amount: totalPrice,
      totalPrice: totalPrice,
      totalPaid: 0,
      paymentAmount: 'full',
      paymentMethod: paymentMethod || 'card',
      cardDetails: { lastFourDigits: '' },
      bookingType: 'plants',
      plantOrderDetails: {
        recipientPerson: recipientPerson,
        deliveryAddress: deliveryAddress,
        orderItems: orderItems
      },
      notes: notes || ''
    });

    await booking.save();

    // Generate Payment Link
    let paymentUrl = null;
    let paymentReference = null;
    let paymentId = null;

    try {
      // Ensure we have a valid email for payment
      const validEmail = user.email && user.email.includes('@') 
        ? user.email 
        : `${normalizedPhone.replace('+', '').replace(/\D/g, '')}@dirwaza.com`;

      const paymentData = {
        amount: totalPrice,
        description: `طلب نباتات - ${plants.map(p => p.name).join(', ')}`,
        customerName: fullName,
        customerEmail: validEmail,
        customerPhone: normalizedPhone,
        orderType: 'plants',
        bookingId: booking._id.toString()
      };

      console.log('🔹 Plant Booking - Generating payment link with data:', JSON.stringify(paymentData, null, 2));
      
      const paymentResult = await noqoodyPay.generatePaymentLink(paymentData);
      
      console.log('🔹 Plant Booking - Payment result:', JSON.stringify(paymentResult, null, 2));

      if (paymentResult && paymentResult.success) {
        paymentUrl = paymentResult.paymentUrl;
        paymentReference = paymentResult.reference;
        paymentId = paymentResult.paymentId;
        booking.paymentReference = paymentReference;
        booking.paymentStatus = 'pending';
        await booking.save();
        console.log('✅ Plant Booking - Payment link generated successfully:', paymentUrl);
      } else {
        console.log('❌ Plant Booking - Payment link generation failed:', paymentResult?.message || 'Unknown error');
      }
    } catch (paymentError) {
      console.error('❌ Plant Booking - Error generating payment link:', paymentError.message);
      console.error('❌ Plant Booking - Payment error stack:', paymentError.stack);
    }

    const savedBooking = await Booking.findById(booking._id);

    // Format receiptOperator response
    const receiptOperator = {
      products: orderItems.map(item => ({
        plantId: item.plantId,
        productName: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      })),
      deliveryDate: '', 
      senderName: fullName,
      receiverName: recipientPerson.fullName,
      phone: mobileNumber,
      giftMessage: recipientPerson?.giftMessage || ''
    };

    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب النباتات بنجاح',
      booking: savedBooking,
      receiptOperator,
      paymentUrl: paymentUrl,
      paymentReference: paymentReference,
      paymentId: paymentId,
      paymentMessage: paymentUrl ? 'تم إنشاء رابط الدفع بنجاح' : 'تم إنشاء الطلب بنجاح - يرجى المتابعة مع خدمة العملاء للدفع'
    });

  } catch (error) {
    console.error('Error creating plant booking:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء طلب النباتات', error: error.message });
  }
};

// GET /api/bookings/rest - Get all rest bookings
export const getAllRestBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    // Build filter query
    const filter = { experienceType: 'rest' };
    
    if (status) {
      filter.bookingStatus = status;
    }
    
    if (startDate || endDate) {
      filter.checkInDates = {};
      if (startDate) {
        filter.checkInDates.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.checkInDates.$lte = new Date(endDate);
      }
    }

    // Get bookings with pagination
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate('userId', 'name email phone')
      .populate('restId', 'name nameAr location images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);

    // Format bookings for response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      bookingReference: booking.bookingReference,
      user: {
        id: booking.userId?._id,
        name: booking.userId?.name,
        email: booking.userId?.email,
        phone: booking.userId?.phone
      },
      rest: {
        id: booking.restId?._id,
        name: booking.restId?.name,
        nameAr: booking.restId?.nameAr,
        location: booking.restId?.location,
        image: booking.restId?.images?.[0]
      },
      checkInDates: booking.checkInDates,
      bookingType: booking.bookingType,
      numberOfPersons: booking.numberOfPersons,
      totalAmount: booking.amount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
      formattedDate: formatArabicDate(booking.checkInDates?.[0])
    }));

    res.json({
      success: true,
      message: 'تم جلب حجوزات الاستراحات بنجاح',
      data: {
        bookings: formattedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching rest bookings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حجوزات الاستراحات',
      error: error.message
    });
  }
};

// GET /api/bookings/horse - Get all horse training bookings
export const getAllHorseBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    // Build filter query
    const filter = { experienceType: 'training' };
    
    if (status) {
      filter.bookingStatus = status;
    }
    
    if (startDate || endDate) {
      filter['horseTrainingDetails.selectedAppointments.date'] = {};
      if (startDate) {
        filter['horseTrainingDetails.selectedAppointments.date'].$gte = startDate;
      }
      if (endDate) {
        filter['horseTrainingDetails.selectedAppointments.date'].$lte = endDate;
      }
    }

    // Get bookings with pagination
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .populate('userId', 'name email phone')
      .populate('experienceId', 'name nameAr description images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);

    // Format bookings for response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      bookingReference: booking.bookingReference,
      user: {
        id: booking.userId?._id,
        name: booking.userId?.name,
        email: booking.userId?.email,
        phone: booking.userId?.phone
      },
      training: {
        id: booking.experienceId?._id,
        name: booking.experienceId?.name,
        nameAr: booking.experienceId?.nameAr,
        description: booking.experienceId?.description,
        image: booking.experienceId?.images?.[0]
      },
      personalInfo: booking.horseTrainingDetails?.personalInfo,
      selectedAppointments: booking.horseTrainingDetails?.selectedAppointments,
      selectedCourse: booking.horseTrainingDetails?.selectedCourseId,
      numberOfPersons: booking.numberOfPersons,
      totalAmount: booking.amount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
      formattedDate: formatArabicDate(booking.horseTrainingDetails?.selectedAppointments?.[0]?.date)
    }));

    res.json({
      success: true,
      message: 'تم جلب حجوزات التدريب بنجاح',
      data: {
        bookings: formattedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching horse training bookings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حجوزات التدريب',
      error: error.message
    });
  }
};

// GET /api/bookings/rest/:restId/disabled-dates - Get disabled dates for rest booking
export const getRestDisabledDates = async (req, res) => {
  try {
    const { restId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate rest exists
    const rest = await Rest.findById(restId);
    if (!rest) {
      return res.status(404).json({
        success: false,
        message: 'الاستراحة غير موجودة'
      });
    }

    // Set date range (default to next 6 months if not provided)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

    // Get all confirmed bookings for this rest in the date range
    const bookings = await Booking.find({
      restId: restId,
      bookingStatus: { $in: ['confirmed', 'pending'] },
      checkInDates: {
        $elemMatch: {
          $gte: start,
          $lte: end
        }
      }
    }).select('checkInDates bookingType');

    // Extract all booked dates
    const disabledDates = [];
    bookings.forEach(booking => {
      if (booking.checkInDates && Array.isArray(booking.checkInDates)) {
        booking.checkInDates.forEach(date => {
          const dateStr = new Date(date).toISOString().split('T')[0];
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        });
      }
    });

    // Sort disabled dates
    disabledDates.sort();

    res.json({
      success: true,
      message: 'تم جلب التواريخ المحجوزة بنجاح',
      data: {
        restId: restId,
        restName: rest.name,
        restNameAr: rest.nameAr,
        basePrice: rest.basePrice || 450,
        weekendPrice: rest.weekendPrice || 600,
        disabledDates: disabledDates,
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching rest disabled dates:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التواريخ المحجوزة',
      error: error.message
    });
  }
};

// GET /api/bookings/horse/:experienceId/disabled-dates - Get disabled dates for horse training
export const getHorseDisabledDates = async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { startDate, endDate, timeSlot } = req.query;

    // Validate experience exists
    const experience = await Training.findById(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'تجربة التدريب غير موجودة'
      });
    }

    // Set date range (default to next 3 months if not provided)
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000);

    // Build query for horse training bookings
    const query = {
      experienceId: experienceId,
      experienceType: 'training',
      bookingStatus: { $in: ['confirmed', 'pending'] },
      'horseTrainingDetails.selectedAppointments.date': {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    };

    // Add time slot filter if provided
    if (timeSlot) {
      query['horseTrainingDetails.selectedAppointments.timeSlot'] = timeSlot;
    }

    const bookings = await Booking.find(query).select('horseTrainingDetails.selectedAppointments');

    // Extract disabled dates and time slots
    const disabledDates = [];
    const disabledTimeSlots = {};

    bookings.forEach(booking => {
      if (booking.horseTrainingDetails?.selectedAppointments) {
        booking.horseTrainingDetails.selectedAppointments.forEach(appointment => {
          const dateStr = appointment.date;
          const timeSlotStr = appointment.timeSlot;

          // If specific time slot requested, only disable that slot
          if (timeSlot) {
            if (timeSlotStr === timeSlot && !disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
          } else {
            // Track time slots per date
            if (!disabledTimeSlots[dateStr]) {
              disabledTimeSlots[dateStr] = [];
            }
            if (!disabledTimeSlots[dateStr].includes(timeSlotStr)) {
              disabledTimeSlots[dateStr].push(timeSlotStr);
            }

            // If all time slots for a date are booked, disable the entire date
            const availableSlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
            if (disabledTimeSlots[dateStr].length >= availableSlots.length) {
              if (!disabledDates.includes(dateStr)) {
                disabledDates.push(dateStr);
              }
            }
          }
        });
      }
    });

    // Sort disabled dates
    disabledDates.sort();

    res.json({
      success: true,
      message: 'تم جلب التواريخ المحجوزة بنجاح',
      data: {
        experienceId: experienceId,
        experienceName: experience.name,
        experienceNameAr: experience.nameAr,
        basePrice: experience.basePrice || 180,
        weekendPrice: experience.weekendPrice || 220,
        disabledDates: disabledDates,
        disabledTimeSlots: timeSlot ? undefined : disabledTimeSlots,
        availableTimeSlots: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching horse training disabled dates:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التواريخ المحجوزة',
      error: error.message
    });
  }
};

/**
 * Handle NoqoodyPay payment redirect callback
 * Processes payment status from redirect URL and updates booking accordingly
 * 
 * Example redirect URL:
 * http://noqoody.com/paymentStatus.html?success=True&code=200&message=SUCCESS&InvoiceNo=NPQNCC1NQPM202005791298611&reference=ref316027323&PUN=NPQNCC1NQPM202005791298611&TransactionId=1479
 */
export const handlePaymentRedirect = async (req, res) => {
  try {
    console.log('🔄 Payment redirect received');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);

    // Extract reference from query params or body
    const reference = req.query.reference || req.body.reference;
    const success = req.query.success || req.body.success;
    const code = req.query.code || req.body.code;
    const message = req.query.message || req.body.message;

    if (!reference) {
      console.error('❌ No payment reference provided in redirect');
      return res.status(400).json({
        success: false,
        message: 'مرجع الدفع مطلوب',
        error: 'Payment reference is required'
      });
    }

    console.log(`🔍 Processing payment redirect for reference: ${reference}`);

    // Call NoqoodyPay revalidation API to verify actual payment status
    console.log('🔄 Calling NoqoodyPay revalidation API...');
    const paymentVerification = await noqoodyPay.verifyPaymentByReference(reference);
    
    console.log('💳 Payment verification result:', paymentVerification);

    // Find booking by payment reference
    const booking = await Booking.findOne({ paymentReference: reference });
    
    if (!booking) {
      console.error(`❌ No booking found for reference: ${reference}`);
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الحجز',
        error: 'Booking not found for this payment reference'
      });
    }

    console.log(`📋 Found booking: ${booking._id} (${booking.experienceType})`);

    // Update booking status based on payment verification
    let updatedBooking;
    let statusMessage;
    let redirectUrl = process.env.FRONTEND_URL || 'https://dirwaza-ten.vercel.app';

    if (paymentVerification.success && paymentVerification.paymentSuccessful) {
      // Payment successful - update booking to confirmed
      updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          paidAt: new Date(),
          transactionId: paymentVerification.transactionId || null,
          paymentMethod: paymentVerification.serviceName || 'noqoody_pay'
        },
        { new: true }
      );

      statusMessage = 'تم تأكيد الدفع والحجز بنجاح';
      redirectUrl += `/ar?payment=success&reference=${reference}&booking=${booking._id}`;
      
      console.log('✅ Payment successful - booking confirmed');

      // Send confirmation notifications
      try {
        await sendBookingConfirmation(booking, updatedBooking);
        await notifyAdminNewBooking(updatedBooking);
      } catch (notificationError) {
        console.error('⚠️ Error sending notifications:', notificationError);
      }

    } else if (paymentVerification.success && paymentVerification.status === 'pending') {
      // Payment still pending
      updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: 'pending',
          bookingStatus: 'pending'
        },
        { new: true }
      );

      statusMessage = 'الدفع قيد المعالجة';
      redirectUrl += `/ar?payment=pending&reference=${reference}&booking=${booking._id}`;
      
      console.log('⏳ Payment pending');

    } else {
      // Payment failed or not found
      updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          paymentStatus: 'failed',
          bookingStatus: 'cancelled',
          failureReason: paymentVerification.error || 'Payment verification failed'
        },
        { new: true }
      );

      statusMessage = 'فشل في الدفع - تم إلغاء الحجز';
      redirectUrl += `/ar?payment=failed&reference=${reference}&booking=${booking._id}`;
      
      console.log('❌ Payment failed - booking cancelled');
    }

    // Return response with redirect information
    const response = {
      success: true,
      message: statusMessage,
      data: {
        booking: {
          id: updatedBooking._id,
          reference: reference,
          paymentStatus: updatedBooking.paymentStatus,
          bookingStatus: updatedBooking.bookingStatus,
          experienceType: updatedBooking.experienceType,
          amount: updatedBooking.amount
        },
        payment: {
          reference: reference,
          status: paymentVerification.status,
          successful: paymentVerification.paymentSuccessful,
          transactionId: paymentVerification.transactionId,
          amount: paymentVerification.amount,
          date: paymentVerification.transactionDate
        },
        redirect: {
          url: redirectUrl,
          shouldRedirect: true
        }
      }
    };

    // If this is a browser request, redirect directly
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      console.log(`🔄 Redirecting browser to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }

    // Otherwise return JSON response
    res.json(response);

  } catch (error) {
    console.error('❌ Error handling payment redirect:', error);
    
    const errorRedirectUrl = `${process.env.FRONTEND_URL || 'https://dirwaza-ten.vercel.app'}/ar?payment=error&message=${encodeURIComponent('حدث خطأ في معالجة الدفع')}`;
    
    // If this is a browser request, redirect to error page
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect(errorRedirectUrl);
    }

    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة حالة الدفع',
      error: error.message,
      redirect: {
        url: errorRedirectUrl,
        shouldRedirect: true
      }
    });
  }
};

/**
 * Manual payment verification endpoint for testing/admin use
 * GET /api/payment/verify-and-update/:reference
 */
export const verifyAndUpdatePayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const lang = req.headers['accept-language'] || 'ar';

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: languageService.getText('validation.referenceRequired', lang)
      });
    }

    console.log(`🔍 Manual verification for reference: ${reference}`);

    // Verify payment with NoqoodyPay
    const paymentVerification = await noqoodyPay.verifyPaymentByReference(reference);
    
    // Find and update booking
    const booking = await Booking.findOne({ paymentReference: reference });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('booking.notFound', lang)
      });
    }

    // Update booking based on verification result
    let updateData = {};
    
    if (paymentVerification.success && paymentVerification.paymentSuccessful) {
      updateData = {
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        paidAt: new Date(),
        transactionId: paymentVerification.transactionId
      };
    } else if (paymentVerification.success && paymentVerification.status === 'pending') {
      updateData = {
        paymentStatus: 'pending',
        bookingStatus: 'pending'
      };
    } else {
      updateData = {
        paymentStatus: 'failed',
        bookingStatus: 'cancelled',
        failureReason: paymentVerification.error || 'Payment verification failed'
      };
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: languageService.getText('payment.verificationComplete', lang),
      data: {
        booking: updatedBooking,
        paymentVerification: paymentVerification
      }
    });

  } catch (error) {
    console.error('❌ Error in manual payment verification:', error);
    res.status(500).json({
      success: false,
      message: languageService.getText('error.general', req.headers['accept-language'] || 'ar'),
      error: error.message
    });
  }
};