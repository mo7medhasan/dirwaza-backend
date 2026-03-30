#!/usr/bin/env node

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Booking from '../src/models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza';

async function testSimpleBooking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user first
    const testUser = new User({
      name: 'Test User Simple',
      phone: '+966501111111',
      email: 'test.simple@example.com',
      isActive: true
    });
    await testUser.save();
    console.log('Created test user:', testUser._id);

    // Create a simple booking
    const booking = new Booking({
      userId: testUser._id,
      userName: 'Test User Simple',
      userPhone: '+966501111111',
      userEmail: 'test.simple@example.com',
      experienceType: 'day_visit',
      date: new Date('2025-08-10'),
      totalPrice: 200,
      totalPaid: 200,
      paymentAmount: 'full',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      bookingType: 'rest',
      notes: 'Test booking'
    });

    await booking.save();
    console.log('✅ Booking created successfully:', booking._id);

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    await Booking.findByIdAndDelete(booking._id);
    console.log('✅ Cleaned up test data');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSimpleBooking();
