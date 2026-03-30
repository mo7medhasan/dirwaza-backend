import mongoose from 'mongoose';

const restSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  images: [{
    type: String,
    required: true
  }],
  features: [{
    type: String,
    required: true
  }],
  amenities: [{
    icon: String,
    label: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  availability: {
    overnight: {
      checkIn: {
        type: String,
        default: "15:00"
      },
      checkOut: {
        type: String,
        default: "12:00"
      }
    },
    withoutOvernight: {
      checkIn: {
        type: String,
        default: "08:00"
      },
      checkOut: {
        type: String,
        default: "18:00"
      }
    }
  },
  href: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// إنشاء فهرس للبحث النصي
restSchema.index({ name: 'text', title: 'text', description: 'text', location: 'text' });

const Rest = mongoose.model('Rest', restSchema);
export default Rest;
