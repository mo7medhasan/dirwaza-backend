import axios from 'axios';

async function testPlantBooking() {
    console.log('🧪 Testing Plant Booking API with NoqoodyPay (Updated Configuration)...\n');
    
    const bookingData = {
        agreedToTerms: true,
        personalInfo: {
            fullName: "سارة أحمد محمد",
            mobileNumber: "+966501234567",
            notes: "أريد نباتات للحديقة المنزلية"
        },
        recipientPerson: {
            fullName: "سارة أحمد محمد",
            mobileNumber: "+966501234567"
        },
        deliveryAddress: {
            city: "الرياض",
            district: "النرجس",
            street: "شارع الأمير محمد بن عبدالعزيز",
            buildingNumber: "1234",
            additionalNumber: "5678"
        },
        orderData: [
            {
                plantId: "507f1f77bcf86cd799439011",
                quantity: 2,
                unitPrice: 75.5
            },
            {
                plantId: "507f1f77bcf86cd799439012",
                quantity: 1,
                unitPrice: 120
            }
        ],
        paymentMethod: "apple_pay"
    };
    
    try {
        console.log('📋 Testing with corrected NoqoodyPay URL configuration...');
        console.log('🚀 Making API request...\n');
        
        const response = await axios.post('http://localhost:5001/api/bookings/plants', bookingData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'ar'
            },
            timeout: 30000
        });
        
        console.log('✅ SUCCESS: Plant booking created!');
        console.log('\n📊 Response Summary:');
        console.log(`Booking ID: ${response.data.booking?._id}`);
        console.log(`Total Price: ${response.data.booking?.totalPrice} SAR`);
        console.log(`Payment Reference: ${response.data.paymentReference}`);
        console.log(`Payment Message: ${response.data.paymentMessage}`);
        
        if (response.data.paymentUrl) {
            console.log('\n🎉 PAYMENT URL GENERATED:');
            console.log(`Payment URL: ${response.data.paymentUrl}`);
            
            // Check if it's a real NoqoodyPay URL
            if (response.data.paymentUrl.includes('noqoodypay.com') || response.data.paymentUrl.includes('azurewebsites.net') || response.data.paymentUrl.includes('enoqoody.com')) {
                console.log('\n✅ REAL NOQOODYPAY URL DETECTED!');
                console.log('🎯 Sandbox payment URLs are now working correctly!');
                return true;
            } else if (response.data.paymentUrl.includes('mock-checkout')) {
                console.log('\n⚠️  Mock payment URL detected');
                console.log('Need valid NoqoodyPay credentials for real URLs');
                return false;
            } else {
                console.log('\n❓ Unknown payment URL format');
                return false;
            }
        } else {
            console.log('\n❌ No payment URL in response');
            console.log('Payment service may have failed');
            return false;
        }
        
    } catch (error) {
        console.log('\n❌ ERROR during plant booking test:');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Error:`, error.response.data);
        } else {
            console.log(`Error: ${error.message}`);
        }
        return false;
    }
}

// Run test
testPlantBooking().then(success => {
    if (success) {
        console.log('\n🎉 SUCCESS: Real NoqoodyPay sandbox URLs are working!');
        process.exit(0);
    } else {
        console.log('\n🚨 Still need valid NoqoodyPay sandbox credentials');
        process.exit(1);
    }
}).catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
});
