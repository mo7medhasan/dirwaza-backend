import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
});

export default mongoose.model('Otp', otpSchema);
