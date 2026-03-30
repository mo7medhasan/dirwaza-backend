import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['children', 'youth', 'women']
  },
  name: {
    type: String,
    required: true
  },
  nameEn: {
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
  icon: {
    type: String,
    required: true
  },
  courses: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    nameEn: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    sessions: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    durationEn: {
      type: String,
      required: true
    }
  }],
  disabledDates: [{
    date: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  timeSlots: {
    weekdays: [{
      type: String,
      required: true
    }],
    weekends: [{
      type: String,
      required: true
    }]
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual for total number of courses
trainingSchema.virtual('totalCourses').get(function() {
  return this.courses.length;
});

// Virtual for average price
trainingSchema.virtual('averagePrice').get(function() {
  if (!this.courses.length) return 0;
  const total = this.courses.reduce((sum, course) => sum + course.price, 0);
  return total / this.courses.length;
});

// Virtual for available dates
trainingSchema.virtual('availableDates').get(function() {
  const today = new Date();
  const availableDates = [];
  
  // Generate dates for next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if date is not in disabled dates
    if (!this.disabledDates.some(d => d.date === dateStr)) {
      availableDates.push({
        date: dateStr,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        timeSlots: date.getDay() === 0 || date.getDay() === 6 
          ? this.timeSlots.weekends 
          : this.timeSlots.weekdays
      });
    }
  }
  
  return availableDates;
});

// Indexes for better performance
trainingSchema.index({ category: 1 });
trainingSchema.index({ 'courses.id': 1 });
trainingSchema.index({ 'disabledDates.date': 1 });

export default mongoose.model('Training', trainingSchema);
