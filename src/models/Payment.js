import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  uuid: {
    type: String,
    required: true
  },
  paymentLink: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['creditCard', 'bankTransfer', 'cash', 'wallet']
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'in_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ userId: 1 });
paymentSchema.index({ sessionId: 1 });
paymentSchema.index({ uuid: 1 });
paymentSchema.index({ paymentStatus: 1 });

export default mongoose.model('Payment', paymentSchema);
