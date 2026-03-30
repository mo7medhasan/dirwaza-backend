import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// POST /api/admin/login
export const adminLogin = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ message: 'يرجى إدخال رقم الجوال وكلمة المرور' });
  }
  const user = await User.findOne({ phone, role: 'admin' });
  if (!user) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, role: user.role } });
};

// POST /api/admin/users (إضافة مستخدم/أدمن جديد)
export const createUser = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ message: 'يرجى تعبئة جميع الحقول المطلوبة' });
    }
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: 'رقم الجوال مستخدم بالفعل' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, email, password: hashed, role });
    res.status(201).json({ message: 'تم إنشاء المستخدم بنجاح', user });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المستخدم', error: error.message });
  }
};

// GET /api/admin/users (جلب كل المستخدمين)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المستخدمين', error: error.message });
  }
};

// PUT /api/admin/users/:id (تعديل بيانات مستخدم)
export const updateUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'تم تحديث المستخدم', user });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث المستخدم', error: error.message });
  }
};

// DELETE /api/admin/users/:id (حذف مستخدم)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المستخدم', error: error.message });
  }
};
