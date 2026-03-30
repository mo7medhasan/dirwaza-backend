import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameEn: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  descriptionEn: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['indoor', 'outdoor', 'succulent', 'flowering', 'herb', 'tree'],
    default: 'indoor'
  },
  careLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  lightRequirement: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  wateringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  },
  stock: {
    type: Number,
    default: 10,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactPhone: {
    type: String,
    required: true,
    match: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
plantSchema.index({ name: 1 });
plantSchema.index({ nameEn: 1 });
plantSchema.index({ isAvailable: 1 });
plantSchema.index({ isOnSale: 1 });
plantSchema.index({ category: 1 });
plantSchema.index({ price: 1 });

// Virtual for discounted price
plantSchema.virtual('discountPercent').get(function() {
  if (this.isOnSale && this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
plantSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Plant', plantSchema);
