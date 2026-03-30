import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

// Test JWT token - replace with a valid admin token
const ADMIN_TOKEN = 'your-admin-jwt-token-here';

const headers = {
  'Content-Type': 'application/json',
  'Accept-Language': 'ar'
};

const authHeaders = {
  ...headers,
  'Authorization': `Bearer ${ADMIN_TOKEN}`
};

console.log('🎯 Testing Dashboard API endpoints...\n');

// Test 1: Get Dashboard Statistics
const testGetDashboardStats = async () => {
  try {
    console.log('📊 Test 1: GET /api/dashboard/stats');
    const response = await axios.get(`${DASHBOARD_URL}/stats`, { headers: authHeaders });
    
    console.log('✅ SUCCESS: Dashboard stats retrieved');
    console.log('📈 Statistics:', {
      equestrianBookings: response.data.data.equestrianBookings.count,
      restBookings: response.data.data.restBookings.count,
      shipments: response.data.data.shipments.count,
      plantOrders: response.data.data.plantOrders.count,
      totalUsers: response.data.data.summary.totalUsers,
      totalRevenue: response.data.data.summary.totalRevenue
    });
    console.log('---\n');
    return response.data;
  } catch (error) {
    console.log('❌ ERROR: Failed to get dashboard stats');
    console.log('Error:', error.response?.data || error.message);
    console.log('---\n');
    return null;
  }
};

// Test 2: Get Recent Activities
const testGetRecentActivities = async () => {
  try {
    console.log('📋 Test 2: GET /api/dashboard/activities');
    const response = await axios.get(`${DASHBOARD_URL}/activities?limit=5`, { headers: authHeaders });
    
    console.log('✅ SUCCESS: Recent activities retrieved');
    console.log('🔄 Activities count:', response.data.data.length);
    if (response.data.data.length > 0) {
      console.log('📝 Sample activity:', {
        type: response.data.data[0].type,
        title: response.data.data[0].title,
        user: response.data.data[0].user,
        status: response.data.data[0].status,
        amount: response.data.data[0].amount
      });
    }
    console.log('---\n');
    return response.data;
  } catch (error) {
    console.log('❌ ERROR: Failed to get recent activities');
    console.log('Error:', error.response?.data || error.message);
    console.log('---\n');
    return null;
  }
};

// Test 3: Get Revenue Analytics
const testGetRevenueAnalytics = async () => {
  try {
    console.log('💰 Test 3: GET /api/dashboard/revenue');
    const response = await axios.get(`${DASHBOARD_URL}/revenue?period=month`, { headers: authHeaders });
    
    console.log('✅ SUCCESS: Revenue analytics retrieved');
    console.log('📊 Revenue summary:', {
      period: response.data.data.period,
      totalRevenue: response.data.data.totalRevenue,
      totalTransactions: response.data.data.totalTransactions,
      currency: response.data.data.currency,
      dataPoints: response.data.data.chartData.length
    });
    console.log('---\n');
    return response.data;
  } catch (error) {
    console.log('❌ ERROR: Failed to get revenue analytics');
    console.log('Error:', error.response?.data || error.message);
    console.log('---\n');
    return null;
  }
};

// Test 4: Test Different Revenue Periods
const testRevenuePeriods = async () => {
  try {
    console.log('📅 Test 4: GET /api/dashboard/revenue (different periods)');
    
    const periods = ['week', 'month', 'year'];
    for (const period of periods) {
      const response = await axios.get(`${DASHBOARD_URL}/revenue?period=${period}`, { headers: authHeaders });
      console.log(`✅ ${period.toUpperCase()} revenue: ${response.data.data.totalRevenue} SAR (${response.data.data.totalTransactions} transactions)`);
    }
    console.log('---\n');
    return true;
  } catch (error) {
    console.log('❌ ERROR: Failed to test revenue periods');
    console.log('Error:', error.response?.data || error.message);
    console.log('---\n');
    return null;
  }
};

// Test 5: Test without authorization (should fail)
const testUnauthorizedAccess = async () => {
  try {
    console.log('🔒 Test 5: GET /api/dashboard/stats (without auth)');
    const response = await axios.get(`${DASHBOARD_URL}/stats`, { headers });
    console.log('❌ UNEXPECTED: Should have failed without auth');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ SUCCESS: Correctly rejected unauthorized access');
      console.log('Status:', error.response.status);
    } else {
      console.log('❌ ERROR: Unexpected error');
      console.log('Error:', error.response?.data || error.message);
    }
  }
  console.log('---\n');
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Dashboard API Tests...\n');
  console.log('⚠️  Note: Make sure to replace ADMIN_TOKEN with a valid admin JWT token\n');
  
  await testGetDashboardStats();
  await testGetRecentActivities();
  await testGetRevenueAnalytics();
  await testRevenuePeriods();
  await testUnauthorizedAccess();
  
  console.log('✅ All Dashboard API tests completed!');
  console.log('📝 Remember to check the response data structures match your frontend requirements.');
};

runTests();
