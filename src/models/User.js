import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: false,
    sparse: true // يسمح بأن يكون الحقل فارغًا لبعض المستخدمين
  },
  password: {
    type: String,
    required: false
  },
  realPassword: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  plants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant'
  }],
  training: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    required: false
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
