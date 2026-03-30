import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Booking from './src/models/Booking.js';
import Contact from './src/models/Contact.js';
import Experience from './src/models/Experience.js';
import Log from './src/models/Log.js';
import Otp from './src/models/Otp.js';
import User from './src/models/User.js';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Hash password
  const hashedPassword = await bcrypt.hash('adminpassword', 10);

  // Seed Experience
  const experience = await Experience.create({
    title: 'Horse Riding',
    type: 'horse_training',
    description: 'Learn to ride horses!',
    price: 200,
    images: [],
    availableDates: [new Date()],
    isActive: true
  });

  // Seed User
  const user = await User.create({
    name: 'Admin User',
    phone: '+1234567890',
    email: 'admin@example.com',
    password: hashedPassword,
    realPassword: 'adminpassword',
    role: 'admin',
    isActive: true
  });

  // Seed Booking
  await Booking.create({
    userName: 'Test User',
    userPhone: '+1234567891',
    userEmail: 'user@example.com',
    experienceType: experience.type,
    experienceId: experience._id,
    date: new Date(),
    timeSlot: '10:00-12:00',
    amount: 150
  });

  // Seed Contact
  await Contact.create({
    name: 'Contact Person',
    phone: '+1234567892',
    email: 'contact@example.com',
    message: 'Hello, I am interested!',
    createdAt: new Date()
  });

  // Seed OTP
  await Otp.create({
    phone: '+1234567893',
    code: '123456',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    used: false
  });

  // Seed Log
  await Log.create({
    action: 'create',
    entity: 'booking',
    entityId: experience._id,
    before: {},
    after: {},
    performedBy: 'Admin User',
    performedById: user._id,
    timestamp: new Date()
  });

  console.log('Seed data inserted!');
  await mongoose.disconnect();
}

seed().catch(e => {
  console.error(e);
  mongoose.disconnect();
});
