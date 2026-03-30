#!/usr/bin/env node

import mongoose from 'mongoose';
import Rest from '../src/models/Rest.js';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dirwaza';

async function testRestLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const restId = '68821a731b8049bb8995cf21';
    console.log('Looking for rest with ID:', restId);
    
    // Test if ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(restId)) {
      console.log('❌ Invalid ObjectId format');
      return;
    }
    
    const rest = await Rest.findById(restId);
    console.log('Rest found:', !!rest);
    
    if (rest) {
      console.log('✅ Rest details:');
      console.log('- Name:', rest.name);
      console.log('- Title:', rest.title);
      console.log('- ID:', rest._id.toString());
    } else {
      console.log('❌ Rest not found');
      
      // List all rests
      const allRests = await Rest.find({}).limit(5);
      console.log('Available rests:');
      allRests.forEach(r => {
        console.log(`- ${r.name} (${r._id})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testRestLookup();
