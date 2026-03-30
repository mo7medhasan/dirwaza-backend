import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.WHATSAPP_FROM; // مثال: 'whatsapp:+14155238886'
const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER; // رقم واتساب الإدارة

const client = twilio(accountSid, authToken);

/**
 * إرسال رسالة واتساب
 * @param {Object} options
 * @param {string} options.to رقم المستلم (مثال: 'whatsapp:+9665xxxxxxx')
 * @param {string} options.body نص الرسالة
 * @returns {Promise<boolean>} نجاح أو فشل الإرسال
 */
async function sendMessage({ to, body }) {
  if (!to || !body) return false;
  try {
    await client.messages.create({
      from: whatsappFrom,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      body
    });
    return true;
  } catch (error) {
    console.error('فشل إرسال رسالة واتساب:', error.message);
    return false;
  }
}

/**
 * إرسال إشعار واتساب للعميل بعد الحجز
 * @param {Object} options
 * @param {string} options.phone رقم العميل (مثال: '+9665xxxxxxx')
 * @param {string} options.bookingId رقم الحجز
 * @param {string} options.experienceName اسم التجربة
 * @param {string} options.date تاريخ الحجز
 * @param {string} options.timeSlot وقت الحجز
 */
export async function sendBookingConfirmation({ phone, bookingId, experienceName, date, timeSlot }) {
  const message = `
مرحباً بك في ديروازة 🏡✨

تم تأكيد حجزك بنجاح ✅

📋 تفاصيل الحجز:
- رقم الحجز: ${bookingId}
- الخدمة: ${experienceName}
- التاريخ: ${new Date(date).toLocaleDateString('ar-SA')}
- الوقت: ${timeSlot}

شكراً لثقتك بنا، سنتواصل معك قريباً لتأكيد التفاصيل النهائية.

للاستفسار: 966500000000+
`;

  return await sendMessage({
    to: phone,
    body: message
  });
}

/**
 * إرسال إشعار للإدارة عند إنشاء حجز جديد
 * @param {Object} booking تفاصيل الحجز
 */
export async function notifyAdminNewBooking(booking) {
  if (!adminWhatsAppNumber) {
    console.warn('لم يتم تحديد رقم واتساب الإدارة');
    return false;
  }

  const message = `
📌 *حجز جديد* 📌

👤 العميل: ${booking.userName}
📞 الجوال: ${booking.userPhone}
📧 البريد: ${booking.userEmail || 'غير محدد'}

📋 تفاصيل الحجز:
- رقم الحجز: ${booking._id}
- الخدمة: ${booking.experienceId?.title || 'غير محدد'}
- النوع: ${getExperienceTypeName(booking.experienceType)}
- التاريخ: ${new Date(booking.date).toLocaleDateString('ar-SA')}
- الوقت: ${booking.timeSlot}
- المبلغ: ${booking.amount} ريال

حالة الدفع: ${getPaymentStatusName(booking.paymentStatus)}
حالة الحجز: ${getBookingStatusName(booking.bookingStatus)}
`;

  return await sendMessage({
    to: adminWhatsAppNumber,
    body: message
  });
}

/**
 * إرسال إشعار للإدارة عند تعديل حجز
 * @param {Object} booking تفاصيل الحجز بعد التعديل
 * @param {Object} oldValues القيم القديمة قبل التعديل
 */
export async function notifyAdminBookingUpdate(booking, oldValues = {}) {
  if (!adminWhatsAppNumber) {
    console.warn('لم يتم تحديد رقم واتساب الإدارة');
    return false;
  }

  let changes = [];
  
  // تتبع التغييرات
  if (oldValues.bookingStatus && oldValues.bookingStatus !== booking.bookingStatus) {
    changes.push(`- تغيير حالة الحجز من ${getBookingStatusName(oldValues.bookingStatus)} إلى ${getBookingStatusName(booking.bookingStatus)}`);
  }
  if (oldValues.paymentStatus && oldValues.paymentStatus !== booking.paymentStatus) {
    changes.push(`- تغيير حالة الدفع من ${getPaymentStatusName(oldValues.paymentStatus)} إلى ${getPaymentStatusName(booking.paymentStatus)}`);
  }
  if (oldValues.date && oldValues.date.toString() !== booking.date.toString()) {
    changes.push(`- تغيير التاريخ من ${new Date(oldValues.date).toLocaleDateString('ar-SA')} إلى ${new Date(booking.date).toLocaleDateString('ar-SA')}`);
  }
  if (oldValues.timeSlot && oldValues.timeSlot !== booking.timeSlot) {
    changes.push(`- تغيير الوقت من ${oldValues.timeSlot} إلى ${booking.timeSlot}`);
  }

  if (changes.length === 0) return false; // لا توجد تغييرات لإشعار بها

  const message = `
🔄 *تم تحديث حجز* 🔄

رقم الحجز: ${booking._id}
👤 العميل: ${booking.userName}
📞 ${booking.userPhone}

التغييرات:
${changes.join('\n')}

رابط لوحة التحكم:
${process.env.ADMIN_PANEL_URL || 'https://your-admin-panel.com'}/bookings/${booking._id}
`;

  return await sendMessage({
    to: adminWhatsAppNumber,
    body: message
  });
}

/**
 * إرسال إشعار للإدارة عند إلغاء حجز
 * @param {Object} booking تفاصيل الحجز الملغي
 */
export async function notifyAdminBookingCancellation(booking) {
  if (!adminWhatsAppNumber) return false;

  const message = `
❌ *تم إلغاء حجز* ❌

رقم الحجز: ${booking._id}
👤 العميل: ${booking.userName}
📞 ${booking.userPhone}

📋 تفاصيل الحجز الملغي:
- الخدمة: ${booking.experienceId?.title || 'غير محدد'}
- التاريخ: ${new Date(booking.date).toLocaleDateString('ar-SA')}
- الوقت: ${booking.timeSlot}
- المبلغ: ${booking.amount} ريال

سبب الإلغاء: ${booking.cancellationReason || 'لم يتم التحديد'}
`;

  return await sendMessage({
    to: adminWhatsAppNumber,
    body: message
  });
}

// دوال مساعدة
function getExperienceTypeName(type) {
  const types = {
    'rest_area': 'منطقة استراحة',
    'horse_training': 'تدريب خيول',
    'nursery': 'حضانة'
  };
  return types[type] || type;
}

function getBookingStatusName(status) {
  const statuses = {
    'confirmed': 'مؤكد',
    'cancelled': 'ملغي'
  };
  return statuses[status] || status;
}

function getPaymentStatusName(status) {
  const statuses = {
    'pending': 'قيد الانتظار',
    'paid': 'مدفوع',
    'failed': 'فشل الدفع'
  };
  return statuses[status] || status;
}
