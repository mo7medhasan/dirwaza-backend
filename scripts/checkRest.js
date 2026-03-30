#!/usr/bin/env node

import mongoose from 'mongoose';
import Rest from '../src/models/Rest.js';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dirwaza';

async function checkRest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const rest = await Rest.findById('6867dd4bc112696d27cef41e');
    console.log('Rest found:', !!rest);
    if (rest) {
      console.log('Rest name:', rest.name);
      console.log('Rest title:', rest.title);
    } else {
      console.log('Rest not found - creating a test rest');
      const testRest = new Rest({
        name: 'Test Rest',
        title: 'Test Rest Title',
        description: 'Test rest for booking',
        rating: 4.5,
        images: ['test-image.jpg'],
        features: ['Pool', 'BBQ'],
        price: 300,
        location: 'Test Location',
        href: '/rest/test-rest',
        availability: {
          overnight: {
            checkIn: '15:00',
            checkOut: '12:00'
          },
          withoutOvernight: {
            checkIn: '09:00',
            checkOut: '18:00'
          }
        }
      });
      await testRest.save();
      console.log('Created test rest:', testRest._id);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRest();
