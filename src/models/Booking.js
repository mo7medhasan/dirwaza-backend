import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  order_id: {
    type: String,
    unique: true,
    index: true,
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true,
    match: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/
  },
  userEmail: {
    type: String,
    default: ''
  },
  
  // Experience booking fields
  experienceId: { 
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId for experiences or String for course IDs
    required: false
  },
  
  // Rest booking fields
  restId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Rest',
    required: false
  },
  
  date: Date,
  timeSlot: String,
  
  // Rest-specific fields
  checkInDates: [{
    type: Date
  }],
  
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partially_paid'], 
    default: 'pending' 
  },
  experienceType: { 
    type: String, 
    enum: ['overnight', 'day_visit', 'delivery', 'training'], 
    default: 'day_visit' 
  },
  
  // Payment fields
  amount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentAmount: {
    type: String,
    enum: ['partial', 'full'],
    default: 'full'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'transfer', 'apple_pay', 'google_pay', 'samsung_pay', 'paypal', 'stc_pay', 'mada'],
    default: 'card'
  },
  
  // Card details (store only last 4 digits for security)
  cardDetails: {
    lastFourDigits: {
      type: String,
      default: ''
    }
  },
  
  // Payment reference from payment gateway
  paymentReference: {
    type: String,
    default: ''
  },
  
  // Booking type
  bookingType: {
    type: String,
    enum: ['experience', 'rest', 'horse_training', 'plants'],
    default: 'experience'
  },
  
  // Horse training specific details
  horseTrainingDetails: {
    parentName: String,
    age: Number,
    previousTraining: String,
    numberPersons: Number,
    selectedCategoryId: String,
    agreedToTerms: Boolean
  },
  
  // Plant order specific details
  plantOrderDetails: {
    orderType: String,
    recipientName: String,
    recipientPhone: String,
    recipientMessage: String,
    deliveryAddress: {
      district: String,
      city: String,
      streetName: String,
      addressDetails: String
    },
    deliveryDate: Date,
    deliveryTime: String,
    orderItems: [{
      plantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant'
      },
      name: String,
      quantity: Number,
      price: Number,
      totalPrice: Number
    }]
  },
  
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
