import mongoose from 'mongoose';

const contactLinkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'instagram', 'whatsapp', 'facebook', 'twitter', 'linkedin', 'phone', 'website', 'tiktok']
  },
  label: {
    type: String,
    required: true
  },
  labelAr: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  hoverColor: {
    type: String,
    default: 'hover:text-blue-600'
  },
  hoverEffect: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    required: true
  },
  ariaLabelAr: {
    type: String,
    required: true
  }
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'contact-info'
  },
  title: {
    type: String,
    required: true,
    default: 'Contact Us'
  },
  titleAr: {
    type: String,
    default: 'تواصل معنا'
  },
  links: [contactLinkSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
contactInfoSchema.index({ id: 1 });
contactInfoSchema.index({ isActive: 1 });

// Virtual for localized title
contactInfoSchema.virtual('localizedTitle').get(function() {
  return this.titleAr || this.title;
});

// Ensure only one contact info document exists
contactInfoSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingCount = await this.constructor.countDocuments();
    if (existingCount > 0) {
      const error = new Error('Only one contact info document is allowed');
      return next(error);
    }
  }
  next();
});

const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);

export default ContactInfo;
