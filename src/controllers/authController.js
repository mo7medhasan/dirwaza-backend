import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { resendOTP, sendOTP } from '../services/smsService.js';

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الجوال وكلمة المرور' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'الحساب غير مفعل. يرجى تفعيل الحساب أولاً.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });
    }
    return res.status(200).json({ message: 'تم تسجيل الدخول بنجاح', user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
};

// تسجيل الخروج
export const logout = (req, res) => {
  // إذا كنت تستخدم ملفات تعريف الارتباط (كوكيز) يمكن مسحها هنا
  // res.clearCookie('token');
  res.status(200).json({ message: 'تم تسجيل الخروج بنجاح' });
};

// تسجيل مستخدم جديد بدون الحاجة لرمز التحقق، يتم إرسال رمز التحقق بعد التسجيل
export const register = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الجوال' });
    }
    
    const exists = await User.findOne({ phone });
    if (exists) {
      // if user exists, return otp and message to user to check otp 
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`محاولة إرسال OTP إلى: ${phone}`);
      const smsResult = await sendOTP({
        phone: phone,
        code: code
      });
      console.log(`نتيجة إرسال SMS:`, smsResult);
      exists.otp = code;
      exists.isActive = false;  // تعيين isActive إلى false للمستخدم الموجود
      await exists.save();
      return res.status(200).json({ 
        message: 'رقم الجوال مستخدم بالفعل، تم إرسال رمز التحقق إلى رقم الجوال',
        otp: code,
        user: {
          id: exists._id,
          phone: exists.phone,
          name: exists.name,
          isActive: exists.isActive
        }
      });
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // إنشاء اسم مستخدم فريد
    const uniqueId = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const uniqueName = `user_${uniqueId}`;
  
    console.log(`محاولة إرسال OTP إلى: ${phone}`);
    const smsResult = await sendOTP({
      phone: phone,
      code: code
    });
    console.log(`نتيجة إرسال SMS:`, smsResult);
    
    const user = await User.create({ 
      phone, 
      otp: code, 
      name: uniqueName,
      isActive: false 
    });
    
    res.status(200).json({ 
      message: 'تم إرسال رمز التحقق إلى رقم الجوال',
      otp: code,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال رمز التحقق', error: error.message });
  }
};

// تفعيل الحساب برمز التحقق
export const checkCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الجوال ورمز التحقق' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    if (user.otp !== code) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
    }
    user.isActive = true;
    user.otp = undefined;
    await user.save();
    
    // إنشاء رمز الوصول JWT
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(200).json({ 
      message: 'تم تفعيل الحساب بنجاح',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التحقق', error: error.message });
  }
};

// إعادة إرسال رمز التحقق
export const resendCode = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'يرجى إدخال رقم الجوال' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    if (user.isActive) {
      return res.status(400).json({ message: 'الحساب مفعل بالفعل' });
    }
    // إنشاء رمز تحقق جديد
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = code;
    await user.save();
    // إرسال الرمز عبر SMS
    console.log(`محاولة إعادة إرسال OTP إلى: ${phone}`);
    const smsResult = await resendOTP({
      phone: phone,
      code: code
    });
    console.log(`نتيجة إعادة إرسال SMS:`, smsResult);
    res.status(200).json({ message: 'تم إرسال رمز تحقق جديد إلى رقم الجوال' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إعادة إرسال الرمز', error: error.message });
  }
};
