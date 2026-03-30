#!/usr/bin/env node

/**
 * Test Script for Horse Training Booking API
 * Tests the POST /api/bookings/horse endpoint with various scenarios
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for horse training booking
const testHorseBooking = {
  agreedToTerms: true,
  personalInfo: {
    fullName: "كوين كين",
    parentName: "هيلاري ريجز",
    age: "51",
    mobileNumber: "01555444333",
    previousTraining: true,
    notes: "لديه خبرة سابقة في الفروسية"
  },
  numberPersons: 1,
  selectedCategoryId: "beginner_category",
  selectedCourseId: '683b5d9c04ce8d65379ac5ea', // Make sure this experience exists
  selectedAppointments: [
    {
      date: "2025-08-15",
      timeSlot: "10:00 AM - 12:00 PM"
    },
    {
      date: "2025-08-17",
      timeSlot: "2:00 PM - 4:00 PM"
    }
  ]
};

async function testHorseBookingAPI() {
  console.log('🐎 Testing Horse Training Booking API...\n');

  try {
    // Test 1: Valid horse training booking
    console.log('📋 Test 1: Valid horse training booking');
    console.log('Request data:', JSON.stringify(testHorseBooking, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, testHorseBooking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Total Bookings:', response.data.totalBookings);
    console.log('Message:', response.data.message);
    console.log('First Booking ID:', response.data.bookings?.[0]?._id);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 2: Missing terms agreement
    console.log('📋 Test 2: Missing terms agreement');
    const noTermsData = { ...testHorseBooking, agreedToTerms: false };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, noTermsData, {
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
    // Test 3: Missing required fields
    console.log('📋 Test 3: Missing required fields (no selectedCourseId)');
    const invalidData = { ...testHorseBooking };
    delete invalidData.selectedCourseId;
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, invalidData, {
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
    // Test 4: No appointments selected
    console.log('📋 Test 4: No appointments selected');
    const noAppointmentsData = { 
      ...testHorseBooking, 
      selectedAppointments: []
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, noAppointmentsData, {
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
    // Test 5: Single appointment booking
    console.log('📋 Test 5: Single appointment booking');
    const singleAppointmentData = { 
      ...testHorseBooking,
      personalInfo: {
        ...testHorseBooking.personalInfo,
        fullName: "سارة محمد",
        mobileNumber: "01666667777",
        age: "25",
        previousTraining: false,
        notes: "مبتدئة في الفروسية"
      },
      selectedAppointments: [
        {
          date: "2025-08-20",
          timeSlot: "9:00 AM - 11:00 AM"
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, singleAppointmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Total Bookings:', response.data.totalBookings);
    console.log('Booking Type:', response.data.bookings?.[0]?.bookingType);
    console.log('Previous Training:', response.data.bookings?.[0]?.horseTrainingDetails?.previousTraining);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 6: Invalid experience ID
    console.log('📋 Test 6: Invalid experience ID');
    const invalidExperienceData = { 
      ...testHorseBooking,
      personalInfo: {
        ...testHorseBooking.personalInfo,
        fullName: "أحمد علي",
        mobileNumber: "01777778888"
      },
      selectedCourseId: "123456789012345678901234" // Invalid ObjectId
    };
    
    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, invalidExperienceData, {
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

  console.log('🏁 Horse Training Booking API tests completed!');
}

// Run the tests
testHorseBookingAPI().catch(console.error);
