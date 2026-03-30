#!/usr/bin/env node

/**
 * Test Script for Rest Booking API
 * Tests the POST /api/bookings/rest endpoint with various scenarios
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for rest booking
const testRestBooking = {
  fullName: "محمد حسن",
  email: "mo7med.hasan5@gmail.com", 
  phone: "01550003860",
  cardDetails: {
    cardNumber: "4111111111111111",
    expiryDate: "12/25",
    cvv: "432"
  },
  paymentAmount: "partial",
  paymentMethod: "card",
  totalPrice: 900,
  totalPaid: 450,
  overnight: true,
  checkIn: [
    "2025-07-29",
    "2025-07-30"
  ],
  restId: "6867dd4bc112696d27cef41e" // Make sure this rest exists
};

async function testRestBookingAPI() {
  console.log('🏡 Testing Rest Booking API...\n');

  try {
    // Test 1: Valid rest booking
    console.log('📋 Test 1: Valid rest booking');
    console.log('Request data:', JSON.stringify(testRestBooking, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, testRestBooking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 2: Missing required fields
    console.log('📋 Test 2: Missing required fields (no restId)');
    const invalidData = { ...testRestBooking };
    delete invalidData.restId;
    
    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, invalidData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Unexpected Success:', response.data);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 3: Invalid rest ID
    console.log('📋 Test 3: Invalid rest ID');
    const invalidRestData = { 
      ...testRestBooking, 
      restId: "123456789012345678901234" // Invalid ObjectId
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, invalidRestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Unexpected Success:', response.data);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 4: Empty check-in dates
    console.log('📋 Test 4: Empty check-in dates');
    const emptyDatesData = { 
      ...testRestBooking, 
      checkIn: []
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, emptyDatesData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Unexpected Success:', response.data);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 5: Day visit booking (overnight: false)
    console.log('📋 Test 5: Day visit booking');
    const dayVisitData = { 
      ...testRestBooking,
      fullName: "فاطمة أحمد",
      phone: "01555554444",
      email: "fatima.ahmed@example.com",
      overnight: false,
      checkIn: ["2025-08-01"],
      totalPrice: 300,
      totalPaid: 300,
      paymentAmount: "full"
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, dayVisitData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Booking Type:', response.data.booking?.experienceType);
    console.log('Payment Status:', response.data.booking?.paymentStatus);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🏁 Rest Booking API tests completed!');
}

// Run the tests
testRestBookingAPI().catch(console.error);
