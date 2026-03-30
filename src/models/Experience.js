import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['rest_area', 'horse_training', 'nursery'],
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  images: [{
    type: String
  }],
  availableDates: [{
    type: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Experience', experienceSchema);
