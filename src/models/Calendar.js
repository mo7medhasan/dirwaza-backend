import mongoose from 'mongoose';

const calendarSchema = new mongoose.Schema({
  experienceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    default: 450
  },
  weekendPrice: {
    type: Number,
    required: true,
    default: 600
  },
  disabledDates: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['booked', 'maintenance', 'closed', 'other'],
      default: 'other'
    },
    description: {
      type: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for faster queries
calendarSchema.index({ experienceId: 1 });
calendarSchema.index({ 'disabledDates.date': 1 });

export default mongoose.model('Calendar', calendarSchema);
