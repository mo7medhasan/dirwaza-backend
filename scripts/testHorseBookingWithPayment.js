import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for horse training booking with payment integration
const testHorseBookingData = {
  agreedToTerms: true,
  personalInfo: {
    fullName: "محمد سعد العتيبي",
    parentName: "سعد محمد العتيبي",
    age: "16",
    mobileNumber: "0555222111",
    previousTraining: "نعم، لدي خبرة سابقة في ركوب الخيل",
    notes: "يرغب في تطوير مهارات الفروسية المتقدمة"
  },
  numberPersons: 1,
  selectedCategoryId: "6869647883db4f542814541b",
  selectedCourseId: "6869647883db4f542814541c", // Valid experience ID
  selectedAppointments: [
    {
      date: "2025-07-30",
      timeSlot: "morning"
    },
    {
      date: "2025-08-01",
      timeSlot: "morning"
    },
    {
      date: "2025-08-03",
      timeSlot: "morning"
    }
  ]
};

async function testHorseBookingWithPayment() {
  console.log('🐎 Testing Horse Training Booking API with Payment Integration...\n');
  
  try {
    console.log('📋 Test Data:');
    console.log('- Student:', testHorseBookingData.personalInfo.fullName);
    console.log('- Parent:', testHorseBookingData.personalInfo.parentName);
    console.log('- Age:', testHorseBookingData.personalInfo.age);
    console.log('- Phone:', testHorseBookingData.personalInfo.mobileNumber);
    console.log('- Sessions:', testHorseBookingData.selectedAppointments.length);
    console.log('- Course ID:', testHorseBookingData.selectedCourseId);
    console.log('- Appointments:', testHorseBookingData.selectedAppointments.map(a => `${a.date} (${a.timeSlot})`).join(', '));
    console.log('\n🚀 Sending request to create horse training booking...\n');

    const response = await axios.post(`${BASE_URL}/api/bookings/horse`, testHorseBookingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Horse Training Booking Created Successfully!');
    console.log('📊 Response Status:', response.status);
    console.log('📝 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if payment URL is included
    if (response.data.paymentUrl) {
      console.log('\n💳 Payment Integration Results:');
      console.log('✅ Payment URL Generated:', response.data.paymentUrl);
      console.log('🔗 Payment Reference:', response.data.paymentReference);
      console.log('🆔 Payment ID:', response.data.paymentId);
      console.log('💰 Total Amount:', response.data.totalAmount, 'SAR');
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
    console.log('🆔 Total Bookings Created:', response.data.totalBookings);
    console.log('💰 Total Amount:', response.data.totalAmount, 'SAR');
    
    if (response.data.bookings && response.data.bookings.length > 0) {
      const firstBooking = response.data.bookings[0];
      console.log('👤 User ID:', firstBooking.userId);
      console.log('📱 Payment Status:', firstBooking.paymentStatus);
      console.log('🔗 Payment Reference:', firstBooking.paymentReference || 'Not set');
      console.log('🐎 Booking Type:', firstBooking.bookingType);
      console.log('🎓 Experience Type:', firstBooking.experienceType);
      console.log('👨‍👩‍👧‍👦 Number of Persons:', firstBooking.horseTrainingDetails?.numberPersons || 'Not set');
      console.log('✅ Agreed to Terms:', firstBooking.horseTrainingDetails?.agreedToTerms || false);
    }
    
  } catch (error) {
    console.error('❌ Error testing horse training booking with payment:');
    
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
  console.log('🧪 Starting Horse Training Booking Payment Integration Tests');
  console.log('=' .repeat(70));
  
  await testHorseBookingWithPayment();
  
  console.log('\n' + '=' .repeat(70));
  console.log('🏁 Test completed!');
}

runTests();
