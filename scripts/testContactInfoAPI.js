import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';
const CONTACT_INFO_URL = `${BASE_URL}/contact-info`;

// Test JWT token - replace with a valid token for authenticated endpoints
const TEST_TOKEN = 'your-jwt-token-here';

const headers = {
  'Content-Type': 'application/json',
  'Accept-Language': 'ar'
};

const authHeaders = {
  ...headers,
  'Authorization': `Bearer ${TEST_TOKEN}`
};

console.log('🧪 Testing Contact Info API endpoints...\n');

// Test 1: Get Contact Info (Public)
const testGetContactInfo = async () => {
  try {
    console.log('📋 Test 1: GET /api/contact-info');
    const response = await axios.get(CONTACT_INFO_URL, { headers });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Contact Links:', response.data.data.links.length);
    
    return response.data.data;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return null;
  }
};

// Test 2: Update Contact Info (Auth Required)
const testUpdateContactInfo = async () => {
  try {
    console.log('\n📝 Test 2: PUT /api/contact-info');
    
    const updateData = {
      title: 'Contact Us - Updated',
      titleAr: 'تواصل معنا - محدث',
      links: [
        {
          id: 'email-updated',
          type: 'email',
          label: 'Email Updated',
          labelAr: 'البريد الإلكتروني محدث',
          url: 'mailto:updated@dirwaza.com',
          icon: 'Mail',
          hoverColor: 'hover:text-blue-600',
          ariaLabel: 'Send Email Updated',
          ariaLabelAr: 'إرسال بريد إلكتروني محدث'
        }
      ]
    };
    
    const response = await axios.put(CONTACT_INFO_URL, updateData, { headers: authHeaders });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 This endpoint requires authentication. Please set a valid JWT token.');
    }
  }
};

// Test 3: Add Contact Link (Auth Required)
const testAddContactLink = async () => {
  try {
    console.log('\n➕ Test 3: POST /api/contact-info/links');
    
    const newLink = {
      id: 'facebook',
      type: 'facebook',
      label: 'Facebook',
      labelAr: 'فيسبوك',
      url: 'https://facebook.com/dirwaza',
      icon: 'Facebook',
      hoverColor: 'hover:text-blue-600',
      ariaLabel: 'Follow on Facebook',
      ariaLabelAr: 'تابعنا على فيسبوك'
    };
    
    const response = await axios.post(`${CONTACT_INFO_URL}/links`, newLink, { headers: authHeaders });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 This endpoint requires authentication. Please set a valid JWT token.');
    }
  }
};

// Test 4: Update Contact Link (Auth Required)
const testUpdateContactLink = async () => {
  try {
    console.log('\n✏️ Test 4: PUT /api/contact-info/links/instagram');
    
    const updateData = {
      label: 'Instagram Updated',
      labelAr: 'إنستغرام محدث',
      url: 'https://instagram.com/dirwaza_updated',
      hoverColor: 'hover:text-purple-600'
    };
    
    const response = await axios.put(`${CONTACT_INFO_URL}/links/instagram`, updateData, { headers: authHeaders });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 This endpoint requires authentication. Please set a valid JWT token.');
    }
  }
};

// Test 5: Delete Contact Link (Auth Required)
const testDeleteContactLink = async () => {
  try {
    console.log('\n🗑️ Test 5: DELETE /api/contact-info/links/facebook');
    
    const response = await axios.delete(`${CONTACT_INFO_URL}/links/facebook`, { headers: authHeaders });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 This endpoint requires authentication. Please set a valid JWT token.');
    }
  }
};

// Test 6: Toggle Contact Info Status (Auth Required)
const testToggleStatus = async () => {
  try {
    console.log('\n🔄 Test 6: PUT /api/contact-info/status');
    
    const response = await axios.put(`${CONTACT_INFO_URL}/status`, {}, { headers: authHeaders });
    
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 This endpoint requires authentication. Please set a valid JWT token.');
    }
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Contact Info API Tests...\n');
  
  await testGetContactInfo();
  await testUpdateContactInfo();
  await testAddContactLink();
  await testUpdateContactLink();
  await testDeleteContactLink();
  await testToggleStatus();
  
  console.log('\n🏁 All tests completed!');
  console.log('\n💡 Note: Authentication-required endpoints need a valid JWT token.');
  console.log('   Update the TEST_TOKEN variable with a real token to test authenticated endpoints.');
};

runTests();
