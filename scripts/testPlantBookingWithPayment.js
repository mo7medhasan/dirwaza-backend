import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for plant booking with payment integration
const testBookingData = {
  totalAmount: 150,
  customerName: "أحمد محمد علي",
  customerEmail: "ahmed.payment@example.com",
  customerPhone: "0555444333",
  orderType: "plants",
  paymentMethod: "card",
  recipientPerson: {
    recipientName: "سارة أحمد",
    phoneNumber: "0555444334",
    message: "يرجى التعامل بحذر مع النباتات",
    deliveryDate: "2025-07-26"
  },
  deliveryAddress: {
    district: "الملز",
    city: "الرياض",
    streetName: "شارع الأمير محمد بن عبدالعزيز",
    addressDetails: "مجمع الأمير محمد، المبنى الثاني"
  },
  deliveryDate: "2025-07-26",
  deliveryTime: "evening",
  cardDetails: {
    cardNumber: "5435 4354 3543 5435",
    expiryDate: "12/25",
    cvv: "123"
  },
  orderData: [
    {
      plantId: "6869647883db4f542814541c",
      name: "نبات الصبار",
      quantity: 1,
      price: 85
    },
    {
      plantId: "6869647883db4f542814541d",
      name: "نبات الورد الجوري",
      quantity: 1,
      price: 65
    }
  ]
};

async function testPlantBookingWithPayment() {
  console.log('🌱 Testing Plant Booking API with Payment Integration...\n');
  
  try {
    console.log('📋 Test Data:');
    console.log('- Customer:', testBookingData.customerName);
    console.log('- Phone:', testBookingData.customerPhone);
    console.log('- Total Amount:', testBookingData.totalAmount, 'SAR');
    console.log('- Order Items:', testBookingData.orderData.length);
    console.log('- Delivery Date:', testBookingData.deliveryDate);
    console.log('- Delivery Address:', `${testBookingData.deliveryAddress.district}, ${testBookingData.deliveryAddress.city}`);
    console.log('\n🚀 Sending request to create plant booking...\n');

    const response = await axios.post(`${BASE_URL}/api/bookings/plants`, testBookingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Plant Booking Created Successfully!');
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
    console.log('💰 Total Amount:', response.data.booking.totalPrice, 'SAR');
    console.log('📱 Payment Status:', response.data.booking.paymentStatus);
    console.log('🔗 Payment Reference:', response.data.booking.paymentReference || 'Not set');
    console.log('🌱 Booking Type:', response.data.booking.bookingType);
    console.log('📦 Order Items:', response.data.booking.plantOrderDetails?.orderItems?.length || 0);
    
  } catch (error) {
    console.error('❌ Error testing plant booking with payment:');
    
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

// Additional test for payment URL accessibility
async function testPaymentUrlAccess(paymentUrl) {
  if (!paymentUrl) {
    console.log('\n⚠️  Skipping payment URL test - no URL provided');
    return;
  }
  
  console.log('\n🔗 Testing Payment URL Accessibility...');
  
  try {
    const response = await axios.get(paymentUrl, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    
    console.log('✅ Payment URL is accessible');
    console.log('📊 Status:', response.status);
    console.log('📄 Content Type:', response.headers['content-type']);
    
    if (response.status === 200) {
      console.log('🎯 Payment page loaded successfully');
    } else {
      console.log('⚠️  Payment page returned status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Payment URL test failed:', error.message);
  }
}

// Run the test
async function runTests() {
  console.log('🧪 Starting Plant Booking Payment Integration Tests');
  console.log('=' .repeat(60));
  
  await testPlantBookingWithPayment();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test completed!');
}

runTests();
