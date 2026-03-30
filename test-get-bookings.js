import axios from 'axios';

const testGetBookings = async () => {
  try {
    console.log('🧪 Testing Get Bookings API...');
    
    // First, let's try without authentication to see the error
    console.log('\n1. Testing without authentication:');
    try {
      const response = await axios.get('http://localhost:5001/api/bookings');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('Expected error (no auth):', error.response?.data);
    }
    
    // Test with a mock admin token (this will likely fail but show the structure)
    console.log('\n2. Testing with mock token:');
    try {
      const response = await axios.get('http://localhost:5001/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-admin-token'
        }
      });
      console.log('✅ Success! Response structure:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Response with mock token:', error.response?.data);
    }
    
    // Test with query parameters
    console.log('\n3. Testing with query parameters:');
    try {
      const response = await axios.get('http://localhost:5001/api/bookings?status=confirmed', {
        headers: {
          'Authorization': 'Bearer mock-admin-token'
        }
      });
      console.log('✅ Success with filters! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Response with filters:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testGetBookings();
