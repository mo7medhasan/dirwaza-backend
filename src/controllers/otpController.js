import Otp from '../models/Otp.js';
import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM } = process.env;
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// توليد كود OTP عشوائي
function generateOtpCode() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 أرقام
}

// إرسال OTP
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^((\+974)|(00974))[0-9]{8}$/.test(phone)) {
      return res.status(400).json({ message: 'يرجى إدخال رقم جوال قطري صحيح' });
    }
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق
    await Otp.create({ phone, code, expiresAt });
    // إرسال SMS عبر Twilio
    await twilioClient.messages.create({
      body: `رمز التحقق الخاص بك: ${code} ينتهي الصلاحية في 5 دقائق`,
      from: TWILIO_SMS_FROM,
      to: phone
    });
    res.json({ message: 'تم إرسال رمز التحقق بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرمز', error: error.message });
  }
};

// تحقق من OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الجوال والرمز' });
    }
    const otp = await Otp.findOne({ phone, code, used: false, expiresAt: { $gt: new Date() } });
    if (!otp) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
    }
    otp.used = true;
    await otp.save();
    res.json({ message: 'تم تأكيد الرمز بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التحقق من الرمز', error: error.message });
  }
};
