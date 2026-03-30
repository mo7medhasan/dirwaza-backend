#!/usr/bin/env node

/**
 * Generate Admin Token Script
 * Creates an admin user and generates a JWT token for testing payment settings endpoint
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

async function generateAdminToken() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin user data
    const adminData = {
      name: 'Admin User',
      phone: '+966500000000',
      email: 'admin@dirwaza.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      isActive: true,
      isVerified: true
    };

    // Check if admin user already exists
    let adminUser = await User.findOne({ 
      $or: [
        { phone: adminData.phone },
        { email: adminData.email }
      ]
    });

    if (adminUser) {
      console.log('👤 Admin user already exists:', {
        id: adminUser._id,
        name: adminUser.name,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role
      });
      
      // Update role to admin if not already
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('🔄 Updated user role to admin');
      }
    } else {
      console.log('👤 Creating new admin user...');
      adminUser = new User(adminData);
      await adminUser.save();
      console.log('✅ Admin user created successfully:', {
        id: adminUser._id,
        name: adminUser.name,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: adminUser._id,
      phone: adminUser.phone,
      role: adminUser.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    console.log('\n🎫 JWT Token Generated:');
    console.log('=' .repeat(80));
    console.log(token);
    console.log('=' .repeat(80));

    console.log('\n📋 Token Details:');
    console.log('- User ID:', adminUser._id);
    console.log('- Role:', adminUser.role);
    console.log('- Expires in: 24 hours');

    console.log('\n🧪 Test the token with:');
    console.log(`curl -X GET http://localhost:5001/api/payment/settings \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Accept: application/json" \\`);
    console.log(`  -H "Accept-Language: ar"`);

    console.log('\n📝 Or update your Postman collection variable:');
    console.log('Variable name: admin_token');
    console.log('Variable value:', token);

  } catch (error) {
    console.error('❌ Error generating admin token:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
generateAdminToken();
