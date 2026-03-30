import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for rest booking with payment integration
const testRestBookingData = {
  fullName: "سعد أحمد محمد",
  email: "saad.rest@example.com",
  phone: "0555333222",
  cardDetails: {
    cardNumber: "4532 1234 5678 9012",
    expiryDate: "12/26",
    cvv: "456"
  },
  paymentAmount: "full",
  paymentMethod: "card",
  totalPrice: 500,
  totalPaid: 500,
  overnight: true,
  checkIn: ["2025-07-28", "2025-07-29"],
  restId: "6869647883db4f542814541a" // Valid rest ID
};

async function testRestBookingWithPayment() {
  console.log('🏡 Testing Rest Booking API with Payment Integration...\n');
  
  try {
    console.log('📋 Test Data:');
    console.log('- Customer:', testRestBookingData.fullName);
    console.log('- Phone:', testRestBookingData.phone);
    console.log('- Total Price:', testRestBookingData.totalPrice, 'SAR');
    console.log('- Booking Type:', testRestBookingData.overnight ? 'مبيت' : 'زيارة يومية');
    console.log('- Check-in Dates:', testRestBookingData.checkIn.join(', '));
    console.log('- Rest ID:', testRestBookingData.restId);
    console.log('\n🚀 Sending request to create rest booking...\n');

    const response = await axios.post(`${BASE_URL}/api/bookings/rest`, testRestBookingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Rest Booking Created Successfully!');
    console.log('📊 Response Status:', response.status);
    console.log('📝 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if payment URL is included
    if (response.data.paymentUrl) {
      console.log('\n💳 Payment Integration Results:');
      console.log('✅ Payment URL Generated:', response.data.paymentUrl);
      console.log('🔗 Payment Reference:', response.data.paymentReference);
      console.log('🆔 Payment ID:', response.data.paymentId);
      console.log('📄 Payment Message:', response.data.paymentMessage);
      
      console.log('\n🎯 Integration Status: SUCCESS - Payment URL included in booking response');
    } else {
      console.log('\n⚠️  Payment Integration Results:');
      console.log('❌ No payment URL in response');
      console.log('📄 Message:', response.data.paymentMessage || 'No payment message');
      
      console.log('\n🎯 Integration Status: PARTIAL - Booking created but no payment URL');
    }
    
    // Verify booking details
    console.log('\n📋 Booking Verification:');
    console.log('🆔 Booking ID:', response.data.booking._id);
    console.log('👤 User ID:', response.data.booking.userId);
    console.log('💰 Total Price:', response.data.booking.totalPrice, 'SAR');
    console.log('📱 Payment Status:', response.data.booking.paymentStatus);
    console.log('🔗 Payment Reference:', response.data.booking.paymentReference || 'Not set');
    console.log('🏡 Booking Type:', response.data.booking.bookingType);
    console.log('🌙 Experience Type:', response.data.booking.experienceType);
    console.log('📅 Check-in Dates:', response.data.booking.checkInDates?.length || 0);
    
  } catch (error) {
    console.error('❌ Error testing rest booking with payment:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('🌐 Network Error - No response received');
      console.error('📡 Request:', error.request);
    } else {
      console.error('⚙️  Setup Error:', error.message);
    }
  }
}

// Run the test
async function runTests() {
  console.log('🧪 Starting Rest Booking Payment Integration Tests');
  console.log('=' .repeat(60));
  
  await testRestBookingWithPayment();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test completed!');
}

runTests();
