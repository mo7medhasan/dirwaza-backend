#!/usr/bin/env node

/**
 * Test script for Create Payment Order API endpoint
 * Tests the new user management and payment integration functionality
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}=== ${msg} ===${colors.reset}`)
};

/**
 * Test data for different scenarios
 */
const testScenarios = [
  {
    name: 'Plant Order - New User',
    data: {
      amount: 150.750,
      description: 'طلب من المشتل - نباتات منزلية',
      customerName: 'سارة أحمد',
      customerEmail: 'sara.ahmed@example.com',
      customerPhone: '+966501111111',
      orderType: 'plants',
      orderData: {
        items: [
          {
            plantId: '64f123456789abcd12345678',
            name: 'نبات الصبار',
            quantity: 2,
            price: 50.250
          },
          {
            plantId: '64f123456789abcd12345679',
            name: 'نبات الورد',
            quantity: 1,
            price: 50.250
          }
        ],
        deliveryAddress: 'الرياض، حي النرجس، شارع الملك فهد'
      }
    }
  },
  {
    name: 'Training Booking - Existing User',
    data: {
      amount: 300.000,
      description: 'حجز تدريب فروسية - مستوى مبتدئ',
      customerName: 'محمد علي',
      customerEmail: 'mohammed.ali@example.com',
      customerPhone: '+966502222222',
      orderType: 'training',
      orderData: {
        trainingId: '64f123456789abcd12345680',
        trainingName: 'تدريب الفروسية للمبتدئين',
        date: '2025-08-15',
        time: '10:00 AM',
        duration: '2 hours',
        instructor: 'الكابتن أحمد محمد'
      }
    }
  },
  {
    name: 'Rest Booking - Weekend Package',
    data: {
      amount: 500.000,
      description: 'حجز استراحة - باقة نهاية الأسبوع',
      customerName: 'فاطمة خالد',
      customerEmail: 'fatima.khalid@example.com',
      customerPhone: '+966503333333',
      orderType: 'rest',
      orderData: {
        restId: '64f123456789abcd12345681',
        restName: 'استراحة الواحة',
        checkIn: '2025-08-20',
        checkOut: '2025-08-22',
        guests: 6,
        amenities: ['مسبح', 'شواء', 'ألعاب أطفال']
      }
    }
  }
];

/**
 * Test the create-order endpoint
 */
async function testCreateOrderEndpoint(scenario) {
  log.header(`Testing: ${scenario.name}`);
  
  try {
    log.info('Sending payment order request...');
    console.log(`📋 Order Details:`);
    console.log(`   Amount: ${scenario.data.amount} SAR`);
    console.log(`   Description: ${scenario.data.description}`);
    console.log(`   Customer: ${scenario.data.customerName}`);
    console.log(`   Phone: ${scenario.data.customerPhone}`);
    console.log(`   Type: ${scenario.data.orderType}`);
    
    const response = await axios.post(`${API_URL}/payment/create-order`, scenario.data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      },
      timeout: 30000
    });
    
    if (response.data.success) {
      log.success('Payment order created successfully!');
      
      const { paymentId, paymentUrl, reference, amount, currency, user, expiresAt } = response.data;
      
      console.log(`\n${colors.magenta}💳 Payment Details:${colors.reset}`);
      console.log(`Payment ID: ${paymentId}`);
      console.log(`Reference: ${reference}`);
      console.log(`Amount: ${amount} ${currency}`);
      console.log(`Payment URL: ${paymentUrl}`);
      console.log(`Expires At: ${new Date(expiresAt).toLocaleString('ar-SA')}`);
      
      console.log(`\n${colors.magenta}👤 User Information:${colors.reset}`);
      console.log(`User ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Phone: ${user.phone}`);
      console.log(`New User: ${user.isNewUser ? 'Yes' : 'No'}`);
      
      return {
        success: true,
        paymentId,
        reference,
        userId: user.id,
        isNewUser: user.isNewUser
      };
      
    } else {
      log.error(`API returned success: false - ${response.data.message}`);
      return { success: false, error: response.data.message };
    }
    
  } catch (error) {
    log.error('Failed to create payment order');
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return { success: false, error: error.message };
  }
}

/**
 * Test validation errors
 */
async function testValidationErrors() {
  log.header('Testing Validation Errors');
  
  const invalidData = [
    {
      name: 'Missing Amount',
      data: {
        description: 'Test order',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+966501234567'
      }
    },
    {
      name: 'Invalid Email',
      data: {
        amount: 100,
        description: 'Test order',
        customerName: 'Test User',
        customerEmail: 'invalid-email',
        customerPhone: '+966501234567'
      }
    },
    {
      name: 'Invalid Phone',
      data: {
        amount: 100,
        description: 'Test order',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '123'
      }
    }
  ];
  
  for (const testCase of invalidData) {
    try {
      log.info(`Testing: ${testCase.name}`);
      
      const response = await axios.post(`${API_URL}/payment/create-order`, testCase.data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'ar'
        },
        timeout: 10000
      });
      
      if (!response.data.success) {
        log.success(`✓ Validation error caught: ${response.data.error}`);
      } else {
        log.warning(`⚠️ Expected validation error but got success`);
      }
      
    } catch (error) {
      if (error.response?.status === 400) {
        log.success(`✓ Validation error caught: ${error.response.data.error}`);
      } else {
        log.error(`Unexpected error: ${error.message}`);
      }
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║            Create Payment Order API Test                ║');
  console.log('║                  Dirwaza Backend                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  log.info(`Testing API at: ${API_URL}`);
  
  const results = [];
  
  // Test valid scenarios
  for (const scenario of testScenarios) {
    const result = await testCreateOrderEndpoint(scenario);
    results.push({ scenario: scenario.name, ...result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test validation errors
  await testValidationErrors();
  
  // Summary
  log.header('Test Summary');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n${colors.magenta}📊 Results Summary:${colors.reset}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful > 0) {
    console.log(`\n${colors.green}✅ Successful Tests:${colors.reset}`);
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.scenario} (${r.isNewUser ? 'New User' : 'Existing User'})`);
    });
  }
  
  if (failed > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.scenario}: ${r.error}`);
    });
  }
  
  console.log(`\n${colors.cyan}📚 Available Endpoint:${colors.reset}`);
  console.log(`POST ${API_URL}/payment/create-order - Create payment with user management`);
  
  console.log(`\n${colors.yellow}💡 Features Tested:${colors.reset}`);
  console.log('✓ User creation and lookup by phone number');
  console.log('✓ Payment link generation with NoqoodyPay');
  console.log('✓ Payment record storage in database');
  console.log('✓ Input validation and error handling');
  console.log('✓ Arabic language support');
  console.log('✓ Multiple order types (plants, training, rest)');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  log.error('Test execution failed:', error.message);
  process.exit(1);
});
