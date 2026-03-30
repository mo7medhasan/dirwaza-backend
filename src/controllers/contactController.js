import Contact from '../models/Contact.js';

// إرسال رسالة تواصل
export const sendContactMessage = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: 'يرجى إدخال الاسم والرسالة' });
    }
    const contact = await Contact.create({ name, phone, email, message });
    res.status(201).json({ message: 'تم إرسال رسالتك بنجاح', contact });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرسالة', error: error.message });
  }
};

// جلب جميع رسائل التواصل (للأدمن)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts, total: contacts.length });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الرسائل', error: error.message });
  }
};

// حذف رسالة تواصل (للأدمن)
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'الرسالة غير موجودة' });
    res.json({ message: 'تم حذف الرسالة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الرسالة', error: error.message });
  }
};
