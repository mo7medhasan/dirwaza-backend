#!/usr/bin/env node

/**
 * Test script to debug NoqoodyPay hash generation
 */

import { createHmac } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NOQOODY_CLIENT_SECRET = process.env.NOQOODY_CLIENT_SECRET;
const NOQOODY_PROJECT_CODE = process.env.NOQOODY_PROJECT_CODE;

console.log('🔍 NoqoodyPay Hash Generation Test\n');

console.log('Environment Variables:');
console.log(`Project Code: ${NOQOODY_PROJECT_CODE}`);
console.log(`Client Secret: ${NOQOODY_CLIENT_SECRET ? `${NOQOODY_CLIENT_SECRET.substring(0, 4)}...` : 'NOT SET'}`);
console.log(`Client Secret Length: ${NOQOODY_CLIENT_SECRET?.length || 0}\n`);

// Test data
const testData = {
  CustomerEmail: 'test@example.com',
  CustomerName: 'Test User',
  CustomerMobile: '+966501234567',
  Description: 'Test Payment',
  ProjectCode: NOQOODY_PROJECT_CODE,
  Reference: 'TEST-123456789',
  Amount: '50.00'
};

console.log('Test Data:');
console.log(JSON.stringify(testData, null, 2));

// Try different hash generation methods
const methods = [
  {
    name: 'Method 1: Original Order (without Amount)',
    hashString: `${testData.CustomerEmail}${testData.CustomerName}${testData.CustomerMobile}${testData.Description}${testData.ProjectCode}${testData.Reference}`
  },
  {
    name: 'Method 2: With Amount at Start',
    hashString: `${testData.Amount}${testData.CustomerEmail}${testData.CustomerName}${testData.CustomerMobile}${testData.Description}${testData.ProjectCode}${testData.Reference}`
  },
  {
    name: 'Method 3: With Amount at End',
    hashString: `${testData.CustomerEmail}${testData.CustomerName}${testData.CustomerMobile}${testData.Description}${testData.ProjectCode}${testData.Reference}${testData.Amount}`
  },
  {
    name: 'Method 4: Alphabetical Order',
    hashString: `${testData.Amount}${testData.CustomerEmail}${testData.CustomerMobile}${testData.CustomerName}${testData.Description}${testData.ProjectCode}${testData.Reference}`
  },
  {
    name: 'Method 5: With Separators',
    hashString: `${testData.CustomerEmail}|${testData.CustomerName}|${testData.CustomerMobile}|${testData.Description}|${testData.ProjectCode}|${testData.Reference}`
  }
];

console.log('\n🔐 Hash Generation Tests:\n');

methods.forEach((method, index) => {
  console.log(`${method.name}:`);
  console.log(`Hash String: "${method.hashString}"`);
  console.log(`String Length: ${method.hashString.length}`);
  
  try {
    const hmac = createHmac('sha256', NOQOODY_CLIENT_SECRET);
    hmac.update(method.hashString, 'utf8');
    const hash = hmac.digest('hex');
    console.log(`Generated Hash: ${hash}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('---\n');
});

// Test with actual NoqoodyPay API format
console.log('🌐 Testing with NoqoodyPay API Request Format:\n');

const apiRequestData = {
  ProjectCode: testData.ProjectCode,
  Description: testData.Description,
  Amount: testData.Amount,
  CustomerEmail: testData.CustomerEmail,
  CustomerMobile: testData.CustomerMobile,
  CustomerName: testData.CustomerName,
  Reference: testData.Reference
};

console.log('API Request Data:');
console.log(JSON.stringify(apiRequestData, null, 2));

// Test if the issue is with field order in the API request
const apiHashString = `${apiRequestData.CustomerEmail}${apiRequestData.CustomerName}${apiRequestData.CustomerMobile}${apiRequestData.Description}${apiRequestData.ProjectCode}${apiRequestData.Reference}`;
console.log(`\nAPI Hash String: "${apiHashString}"`);

const apiHmac = createHmac('sha256', NOQOODY_CLIENT_SECRET);
apiHmac.update(apiHashString, 'utf8');
const apiHash = apiHmac.digest('hex');
console.log(`API Generated Hash: ${apiHash}`);

console.log('\n💡 Recommendations:');
console.log('1. Verify the Client Secret is correct');
console.log('2. Check NoqoodyPay documentation for exact hash generation requirements');
console.log('3. Ensure field order matches their specification');
console.log('4. Verify if Amount should be included in hash generation');
console.log('5. Check if there are any special characters or encoding requirements');
