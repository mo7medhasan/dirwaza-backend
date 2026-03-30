import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  action: { type: String, required: true }, // create, update, delete
  entity: { type: String, required: true }, // booking, user, experience
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  before: { type: Object }, // بيانات قبل التغيير (اختياري)
  after: { type: Object },  // بيانات بعد التغيير (اختياري)
  performedBy: { type: String, required: true }, // اسم أو معرف الأدمن
  performedById: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Log', logSchema);
