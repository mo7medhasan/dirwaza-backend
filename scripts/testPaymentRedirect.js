#!/usr/bin/env node

/**
 * Test Payment Redirect Flow
 * Tests the complete NoqoodyPay payment redirect and booking status update flow
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  // Test booking data
  testBooking: {
    agreedToTerms: true,
    personalInfo: {
      fullName: 'أحمد محمد العلي',
      mobileNumber: '+966501234567',
      notes: 'اختبار نظام الدفع والتحديث التلقائي'
    },
    recipientPerson: {
      fullName: 'أحمد محمد العلي',
      mobileNumber: '+966501234567'
    },
    deliveryAddress: {
      city: 'الرياض',
      district: 'النرجس',
      street: 'شارع الأمير محمد بن عبدالعزيز',
      buildingNumber: '1234',
      additionalNumber: '5678'
    },
    orderData: [
      {
        plantId: '507f1f77bcf86cd799439011',
        quantity: 1,
        unitPrice: 75.5
      }
    ],
    paymentMethod: 'apple_pay'
  },

  // Simulated NoqoodyPay redirect URLs
  redirectUrls: {
    success: {
      url: '/api/payment/payment-redirect',
      params: {
        success: 'True',
        code: '200',
        message: 'SUCCESS',
        InvoiceNo: 'NPQNCC1NQPM202005791298611',
        reference: 'DIRW-TEST-REDIRECT-SUCCESS',
        PUN: 'NPQNCC1NQPM202005791298611',
        TransactionId: '1479'
      }
    },
    failed: {
      url: '/api/payment/payment-redirect',
      params: {
        success: 'False',
        code: '400',
        message: 'FAILED',
        reference: 'DIRW-TEST-REDIRECT-FAILED',
        error: 'Payment declined'
      }
    },
    pending: {
      url: '/api/payment/payment-redirect',
      params: {
        success: 'Pending',
        code: '102',
        message: 'PENDING',
        reference: 'DIRW-TEST-REDIRECT-PENDING'
      }
    }
  }
};

/**
 * Create a test booking to get a payment reference
 */
async function createTestBooking() {
  try {
    console.log('🔹 Creating test plant booking...');
    
    const response = await axios.post(`${API_BASE}/bookings/plants`, TEST_CONFIG.testBooking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    if (response.data.success) {
      console.log('✅ Test booking created successfully');
      console.log(`📋 Booking ID: ${response.data.booking._id}`);
      console.log(`💳 Payment Reference: ${response.data.paymentReference}`);
      console.log(`💰 Amount: ${response.data.booking.amount} SAR`);
      
      return {
        bookingId: response.data.booking._id,
        paymentReference: response.data.paymentReference,
        amount: response.data.booking.amount,
        paymentUrl: response.data.paymentUrl
      };
    } else {
      throw new Error(response.data.message || 'Failed to create test booking');
    }

  } catch (error) {
    console.error('❌ Error creating test booking:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test payment redirect handler with different scenarios
 */
async function testPaymentRedirect(scenario, paymentReference) {
  try {
    console.log(`\n🔄 Testing ${scenario} payment redirect...`);
    
    const redirectConfig = TEST_CONFIG.redirectUrls[scenario];
    
    // Update the reference to use the actual payment reference from booking
    const params = {
      ...redirectConfig.params,
      reference: paymentReference
    };
    
    console.log('🔹 Redirect parameters:', params);
    
    // Test GET request (simulating browser redirect)
    const queryString = new URLSearchParams(params).toString();
    const getResponse = await axios.get(`${API_BASE}${redirectConfig.url}?${queryString}`, {
      headers: {
        'Accept': 'application/json'
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400 // Don't throw on 3xx redirects
    });

    console.log(`✅ GET redirect response (${scenario}):`, {
      status: getResponse.status,
      success: getResponse.data?.success,
      message: getResponse.data?.message,
      paymentStatus: getResponse.data?.data?.booking?.paymentStatus,
      bookingStatus: getResponse.data?.data?.booking?.bookingStatus,
      redirectUrl: getResponse.data?.data?.redirect?.url
    });

    // Test POST request (simulating webhook)
    const postResponse = await axios.post(`${API_BASE}${redirectConfig.url}`, params, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`✅ POST redirect response (${scenario}):`, {
      status: postResponse.status,
      success: postResponse.data?.success,
      message: postResponse.data?.message,
      paymentStatus: postResponse.data?.data?.booking?.paymentStatus,
      bookingStatus: postResponse.data?.data?.booking?.bookingStatus
    });

    return {
      scenario,
      getResponse: getResponse.data,
      postResponse: postResponse.data
    };

  } catch (error) {
    console.error(`❌ Error testing ${scenario} redirect:`, error.response?.data || error.message);
    return {
      scenario,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test manual payment verification endpoint
 */
async function testManualVerification(paymentReference) {
  try {
    console.log('\n🔍 Testing manual payment verification...');
    
    const response = await axios.get(`${API_BASE}/payment/verify-and-update/${paymentReference}`, {
      headers: {
        'Accept-Language': 'ar'
      }
    });

    console.log('✅ Manual verification response:', {
      status: response.status,
      success: response.data?.success,
      message: response.data?.message,
      bookingStatus: response.data?.data?.booking?.bookingStatus,
      paymentStatus: response.data?.data?.booking?.paymentStatus
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error in manual verification:', error.response?.data || error.message);
    return { error: error.response?.data || error.message };
  }
}

/**
 * Test the complete payment redirect flow
 */
async function testCompleteFlow() {
  console.log('🚀 Starting Payment Redirect Flow Test');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create test booking
    const booking = await createTestBooking();
    
    // Step 2: Test different redirect scenarios
    const scenarios = ['success', 'failed', 'pending'];
    const results = [];
    
    for (const scenario of scenarios) {
      const result = await testPaymentRedirect(scenario, booking.paymentReference);
      results.push(result);
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Test manual verification
    const manualVerification = await testManualVerification(booking.paymentReference);
    
    // Step 4: Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📋 Test Booking ID: ${booking.bookingId}`);
    console.log(`💳 Payment Reference: ${booking.paymentReference}`);
    console.log(`💰 Amount: ${booking.amount} SAR`);
    
    console.log('\n🔄 Redirect Test Results:');
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.scenario}: ERROR - ${result.error.message || result.error}`);
      } else {
        console.log(`✅ ${result.scenario}: SUCCESS`);
        console.log(`   - Payment Status: ${result.postResponse?.data?.booking?.paymentStatus}`);
        console.log(`   - Booking Status: ${result.postResponse?.data?.booking?.bookingStatus}`);
      }
    });
    
    console.log('\n🔍 Manual Verification:');
    if (manualVerification.error) {
      console.log(`❌ ERROR: ${manualVerification.error.message || manualVerification.error}`);
    } else {
      console.log(`✅ SUCCESS`);
      console.log(`   - Payment Status: ${manualVerification.data?.booking?.paymentStatus}`);
      console.log(`   - Booking Status: ${manualVerification.data?.booking?.bookingStatus}`);
    }
    
    console.log('\n🎯 INTEGRATION ENDPOINTS READY:');
    console.log(`📍 Payment Redirect: ${BASE_URL}/api/payment/payment-redirect`);
    console.log(`📍 Manual Verification: ${BASE_URL}/api/payment/verify-and-update/{reference}`);
    console.log(`📍 Webhook Handler: ${BASE_URL}/api/payment/webhook/noqoody`);
    
    console.log('\n✅ Payment redirect flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test individual redirect URL (for quick testing)
 */
async function testSingleRedirect() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node testPaymentRedirect.js single <reference> [scenario]');
    console.log('Example: node testPaymentRedirect.js single DIRW-123456789 success');
    return;
  }
  
  const reference = args[1];
  const scenario = args[2] || 'success';
  
  console.log(`🔄 Testing single redirect: ${scenario} for reference: ${reference}`);
  
  const result = await testPaymentRedirect(scenario, reference);
  
  if (result.error) {
    console.error('❌ Test failed:', result.error);
  } else {
    console.log('✅ Test completed successfully');
  }
}

// Main execution
if (process.argv[2] === 'single') {
  testSingleRedirect();
} else {
  testCompleteFlow();
}
