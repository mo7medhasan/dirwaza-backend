import twilio from 'twilio';

/**
 * إرسال رسالة SMS
 * @param {Object} options
 * @param {string} options.to رقم المستلم (مثال: '+9665xxxxxxx')
 * @param {string} options.body نص الرسالة
 * @returns {Promise<boolean>} نجاح أو فشل الإرسال
 */
async function sendSMS({ to, body }) {
  if (!to || !body) {
    console.error('رقم الهاتف أو نص الرسالة مفقود');
    return false;
  }

  // Read environment variables inside the function
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.SMS_FROM;

  if (!accountSid || !authToken || !smsFrom) {
    console.error('إعدادات Twilio مفقودة في متغيرات البيئة');
    console.error('TWILIO_ACCOUNT_SID:', accountSid ? 'موجود' : 'مفقود');
    console.error('TWILIO_AUTH_TOKEN:', authToken ? 'موجود' : 'مفقود');
    console.error('SMS_FROM:', smsFrom ? 'موجود' : 'مفقود');
    return false;
  }

  // Create Twilio client inside the function
  const client = twilio(accountSid, authToken);

  try {
    console.log(`محاولة إرسال SMS إلى: ${to}`);
    
    const message = await client.messages.create({
      from: smsFrom,
      to: to.startsWith('+') ? to : `+${to}`,
      body
    });
    
    console.log(`تم إرسال SMS بنجاح - SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('فشل إرسال SMS:', error.message);
    console.error('تفاصيل الخطأ:', error);
    return false;
  }
}

/**
 * إرسال رمز التحقق OTP عبر SMS
 * @param {Object} options
 * @param {string} options.phone رقم الهاتف (مثال: '+9665xxxxxxx')
 * @param {string} options.code رمز التحقق
 * @returns {Promise<boolean>} نجاح أو فشل الإرسال
 */
export async function sendOTP({ phone, code }) {
  const message = `رمز التحقق: ${code}
الخاص بك في موقع دروازة يرجى استخدام هذا الرمز لتسجيل الدخول، وعدم مشاركته مع أي شخص.

`;

  return await sendSMS({
    to: phone,
    body: message
  });
}

/**
 * إرسال رمز تحقق جديد عبر SMS
 * @param {Object} options
 * @param {string} options.phone رقم الهاتف
 * @param {string} options.code رمز التحقق الجديد
 * @returns {Promise<boolean>} نجاح أو فشل الإرسال
 */
export async function resendOTP({ phone, code }) {
  const message = `رمز التحقق الجديد: ${code}

الخاص بك في موقع دروازة يرجى استخدام هذا الرمز لتسجيل الدخول، وعدم مشاركته مع أي شخص.

`;

  return await sendSMS({
    to: phone,
    body: message
  });
}

/**
 * إرسال رسالة SMS مخصصة
 * @param {Object} options
 * @param {string} options.phone رقم الهاتف
 * @param {string} options.message نص الرسالة
 * @returns {Promise<boolean>} نجاح أو فشل الإرسال
 */
export async function sendCustomSMS({ phone, message }) {
  return await sendSMS({
    to: phone,
    body: message
  });
}

export default {
  sendOTP,
  resendOTP,
  sendCustomSMS
};
