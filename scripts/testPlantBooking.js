#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test data for plant booking
const testPlantBooking = {
  totalAmount: 150,
  customerName: "أحمد محمد",
  customerEmail: "ahmed@example.com",
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
      name: "نبات الورد",
      quantity: 1,
      price: 65
    }
  ]
};

async function testPlantBookingAPI() {
  console.log('🌱 Testing Plant Booking API...\n');

  try {
    // Test 1: Valid plant booking
    console.log('📋 Test 1: Valid plant booking');
    console.log('Request data:', JSON.stringify(testPlantBooking, null, 2));
    
    const response1 = await axios.post(`${BASE_URL}/api/bookings/plants`, testPlantBooking, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('✅ Success Response:');
    console.log('Status:', response1.status);
    console.log('Data:', JSON.stringify(response1.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
  }

  try {
    // Test 2: Missing required fields (no customerName)
    console.log('📋 Test 2: Missing required fields (no customerName)');
    const invalidData = { ...testPlantBooking };
    delete invalidData.customerName;
    
    const response2 = await axios.post(`${BASE_URL}/api/bookings/plants`, invalidData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('❌ Unexpected Success Response:');
    console.log('Status:', response2.status);
    console.log('Data:', JSON.stringify(response2.data, null, 2));

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Test 3: Missing delivery information
    console.log('📋 Test 3: Missing delivery information (no district)');
    const invalidDeliveryData = {
      ...testPlantBooking,
      deliveryAddress: {
        ...testPlantBooking.deliveryAddress,
        district: undefined
      }
    };
    
    const response3 = await axios.post(`${BASE_URL}/api/bookings/plants`, invalidDeliveryData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('❌ Unexpected Success Response:');
    console.log('Status:', response3.status);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Test 4: Invalid phone number format
    console.log('📋 Test 4: Invalid phone number format');
    const invalidPhoneData = {
      ...testPlantBooking,
      customerPhone: "+1 (555) 123-4567" // US format
    };
    
    const response4 = await axios.post(`${BASE_URL}/api/bookings/plants`, invalidPhoneData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('❌ Unexpected Success Response:');
    console.log('Status:', response4.status);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Test 5: Incorrect total amount
    console.log('📋 Test 5: Incorrect total amount');
    const incorrectTotalData = {
      ...testPlantBooking,
      totalAmount: 200 // Should be 150 (85 + 65)
    };
    
    const response5 = await axios.post(`${BASE_URL}/api/bookings/plants`, incorrectTotalData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('❌ Unexpected Success Response:');
    console.log('Status:', response5.status);

  } catch (error) {
    console.log('✅ Expected Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Test 6: Single plant order
    console.log('📋 Test 6: Single plant order');
    const singlePlantData = {
      ...testPlantBooking,
      totalAmount: 85,
      orderData: [
        {
          plantId: "6869647883db4f542814541c",
          name: "نبات الصبار",
          quantity: 1,
          price: 85
        }
      ],
      recipientPerson: {
        ...testPlantBooking.recipientPerson,
        recipientName: "فاطمة علي",
        phoneNumber: "0555444335",
        message: "هدية لصديقتي"
      }
    };
    
    const response6 = await axios.post(`${BASE_URL}/api/bookings/plants`, singlePlantData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });
    
    console.log('✅ Success Response:');
    console.log('Status:', response6.status);
    console.log('Booking Type:', response6.data.booking?.bookingType);
    console.log('Total Amount:', response6.data.booking?.totalPrice);
    console.log('Order Items Count:', response6.data.booking?.plantOrderDetails?.orderItems?.length);

  } catch (error) {
    console.log('❌ Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
  }
  console.log('\n' + '='.repeat(80) + '\n');

  console.log('🏁 Plant Booking API tests completed!');
}

testPlantBookingAPI();
