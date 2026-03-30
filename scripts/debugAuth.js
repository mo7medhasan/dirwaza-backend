#!/usr/bin/env node

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza';

async function debugAuth() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const userId = '688088130dbba76ccc29a330';
    console.log('Looking for user with ID:', userId);
    
    // Try both string and ObjectId
    const userByString = await User.findById(userId);
    console.log('User found by string:', !!userByString);
    
    const userByObjectId = await User.findById(new mongoose.Types.ObjectId(userId));
    console.log('User found by ObjectId:', !!userByObjectId);
    
    if (userByString) {
      console.log('User details:', { 
        id: userByString._id.toString(), 
        role: userByString.role,
        phone: userByString.phone 
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAuth();
