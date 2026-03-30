#!/usr/bin/env node

/**
 * Test script for Payment Channels API endpoints
 * Tests the new NoqoodyPay integration for fetching available payment services
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
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
 * Test the payment channels endpoint
 */
async function testPaymentChannels() {
  log.header('Testing Payment Channels Endpoint');
  
  try {
    log.info('Fetching available payment channels...');
    
    const response = await axios.get(`${API_URL}/payment/channels`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      },
      timeout: 30000
    });
    
    if (response.data.success) {
      log.success('Payment channels retrieved successfully!');
      
      const { channels, total } = response.data;
      
      console.log(`\n${colors.magenta}📊 Payment Channels Summary:${colors.reset}`);
      console.log(`Total channels: ${total}`);
      
      if (channels && channels.length > 0) {
        console.log('\n📋 Available Payment Methods:');
        channels.forEach((channel, index) => {
          console.log(`\n${index + 1}. ${channel.nameAr} (${channel.name})`);
          console.log(`   📝 Description: ${channel.descriptionAr}`);
          console.log(`   🆔 Service ID: ${channel.serviceId}`);
          console.log(`   ✅ Status: ${channel.isActive ? 'Active' : 'Inactive'}`);
          console.log(`   🔗 Redirect URL: ${channel.redirectUrl}`);
        });
      } else {
        log.warning('No payment channels found');
      }
      
    } else {
      log.error(`API returned success: false - ${response.data.message}`);
    }
    
  } catch (error) {
    log.error('Failed to fetch payment channels');
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

/**
 * Test the user settings endpoint (requires admin token)
 */
async function testUserSettings() {
  log.header('Testing User Settings Endpoint (Admin Required)');
  
  try {
    log.info('Attempting to fetch user settings...');
    log.warning('Note: This endpoint requires admin authentication');
    
    const response = await axios.get(`${API_URL}/payment/settings`, {
      headers: {
        'Accept': 'application/json',
        // Note: You would need to add a valid admin JWT token here
        // 'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
      },
      timeout: 30000
    });
    
    if (response.data.success) {
      log.success('User settings retrieved successfully!');
      
      const settings = response.data;
      
      console.log(`\n${colors.magenta}🏢 Project Information:${colors.reset}`);
      if (settings.UserProjects && settings.UserProjects.length > 0) {
        const project = settings.UserProjects[0];
        console.log(`Project Name: ${project.ProjectName}`);
        console.log(`Project Code: ${project.ProjectCode}`);
        console.log(`Description: ${project.ProjectDescription}`);
        console.log(`Access URL: ${project.AccessURL}`);
        console.log(`Status: ${project.IsActive ? 'Active' : 'Inactive'}`);
        console.log(`Services Count: ${project.ServicesList?.length || 0}`);
      }
      
    } else {
      log.error(`API returned success: false - ${response.data.message}`);
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      log.warning('Authentication required - Please provide admin JWT token');
    } else if (error.response?.status === 403) {
      log.warning('Access denied - Admin privileges required');
    } else {
      log.error('Failed to fetch user settings');
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
}

/**
 * Test NoqoodyPay configuration
 */
async function testConfiguration() {
  log.header('Testing NoqoodyPay Configuration');
  
  const requiredEnvVars = [
    'NOQOODY_USERNAME',
    'NOQOODY_PASSWORD',
    'NOQOODY_PROJECT_CODE',
    'NOQOODY_CLIENT_SECRET'
  ];
  
  console.log('🔍 Checking environment variables:');
  
  let allConfigured = true;
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== `YOUR_${varName}`) {
      log.success(`${varName}: Configured ✓`);
    } else {
      log.error(`${varName}: Missing or using default value`);
      allConfigured = false;
    }
  });
  
  if (allConfigured) {
    log.success('All NoqoodyPay environment variables are configured!');
  } else {
    log.warning('Some environment variables are missing. Payment features may not work properly.');
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║               Payment Channels API Test                 ║');
  console.log('║                  Dirwaza Backend                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  log.info(`Testing API at: ${API_URL}`);
  
  // Test configuration first
  await testConfiguration();
  
  // Test payment channels endpoint
  await testPaymentChannels();
  
  // Test user settings endpoint
  await testUserSettings();
  
  log.header('Test Summary');
  log.info('Payment channels test completed');
  log.warning('To test admin endpoints, add a valid JWT token to the Authorization header');
  
  console.log(`\n${colors.cyan}📚 Available Endpoints:${colors.reset}`);
  console.log(`GET ${API_URL}/payment/channels - Get available payment methods`);
  console.log(`GET ${API_URL}/payment/settings - Get user settings (Admin only)`);
  
  console.log(`\n${colors.yellow}💡 Next Steps:${colors.reset}`);
  console.log('1. Ensure NoqoodyPay credentials are properly configured');
  console.log('2. Test with real payment data');
  console.log('3. Integrate with frontend payment selection');
  console.log('4. Add admin authentication for settings endpoint');
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
