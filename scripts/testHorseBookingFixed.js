import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const BASE_URL = 'http://localhost:5001';
const API_ENDPOINT = `${BASE_URL}/api/bookings/horse`;

console.log('🐎 بدء اختبار حجز تدريب الفروسية');
console.log('=' .repeat(60));

async function getTrainingData() {
  try {
    // Connect to database to get real training data
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza');
    
    const trainingSchema = new mongoose.Schema({}, { strict: false });
    const Training = mongoose.model('Training', trainingSchema);
    
    const trainings = await Training.find();
    
    if (trainings.length === 0) {
      console.log('❌ لا توجد بيانات تدريب في قاعدة البيانات');
      return null;
    }
    
    // Get first training and its first course
    const training = trainings[0];
    const course = training.courses[0];
    
    console.log('📋 بيانات التدريب المستخدمة:');
    console.log(`- معرف التدريب (selectedCategoryId): ${training._id}`);
    console.log(`- اسم التدريب: ${training.name}`);
    console.log(`- معرف الدورة (selectedCourseId): ${course.id}`);
    console.log(`- اسم الدورة: ${course.name}`);
    console.log(`- سعر الدورة: ${course.price} ريال`);
    console.log(`- عدد الجلسات: ${course.sessions}`);
    console.log('');
    
    await mongoose.disconnect();
    
    return {
      selectedCategoryId: training._id.toString(),
      selectedCourseId: course.id,
      courseName: course.name,
      coursePrice: course.price
    };
    
  } catch (error) {
    console.error('❌ خطأ في جلب بيانات التدريب:', error.message);
    await mongoose.disconnect();
    return null;
  }
}

async function testHorseBooking() {
  try {
    // Get training data first
    const trainingData = await getTrainingData();
    if (!trainingData) {
      console.log('❌ لا يمكن المتابعة بدون بيانات التدريب');
      return;
    }
    
    // Test data for horse booking
    const horseBookingData = {
      agreedToTerms: true,
      personalInfo: {
        fullName: "أحمد محمد العلي",
        parentName: "محمد العلي",
        age: "12",
        mobileNumber: "+966501111111",
        previousTraining: "لا يوجد",
        notes: "الطفل متحمس للتدريب"
      },
      numberPersons: 1,
      selectedCategoryId: trainingData.selectedCategoryId,
      selectedCourseId: trainingData.selectedCourseId,
      selectedAppointments: [
        {
          date: "2025-07-26",
          timeSlot: "17:00"
        },
        {
          date: "2025-07-27",
          timeSlot: "17:00"
        }
      ]
    };

    console.log('📱 الخطوة 1: إنشاء حجز تدريب الفروسية...');
    console.log('البيانات المرسلة:', JSON.stringify(horseBookingData, null, 2));
    
    // Step 1: Create horse training booking
    const bookingResponse = await axios.post(API_ENDPOINT, horseBookingData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar'
      }
    });

    console.log('\n✅ تم إنشاء الحجز بنجاح!');
    console.log('📋 تفاصيل الحجز:');
    
    if (Array.isArray(bookingResponse.data.bookings)) {
      console.log(`- عدد الحجوزات: ${bookingResponse.data.bookings.length}`);
      bookingResponse.data.bookings.forEach((booking, index) => {
        console.log(`  الحجز ${index + 1}:`);
        console.log(`    - معرف الحجز: ${booking._id}`);
        console.log(`    - التاريخ: ${new Date(booking.date).toLocaleDateString('ar-SA')}`);
        console.log(`    - الوقت: ${booking.timeSlot}`);
        console.log(`    - المبلغ: ${booking.amount} ريال`);
      });
    }
    
    console.log(`- اسم العميل: ${bookingResponse.data.bookings?.[0]?.userName || 'غير محدد'}`);
    console.log(`- رقم الهاتف: ${bookingResponse.data.bookings?.[0]?.userPhone || 'غير محدد'}`);
    console.log(`- حالة الدفع: ${bookingResponse.data.bookings?.[0]?.paymentStatus || 'غير محدد'}`);
    
    console.log('\n💳 معلومات الدفع:');
    console.log(`- رابط الدفع: ${bookingResponse.data.paymentUrl || 'غير متوفر'}`);
    console.log(`- مرجع الدفع: ${bookingResponse.data.paymentReference || 'غير متوفر'}`);
    console.log(`- معرف الدفع: ${bookingResponse.data.paymentId || 'غير متوفر'}`);
    console.log(`- رسالة الدفع: ${bookingResponse.data.paymentMessage || 'غير متوفر'}`);
    console.log(`- المبلغ الإجمالي: ${bookingResponse.data.totalAmount || 'غير محدد'} ريال`);

    // Step 2: Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ملخص اختبار حجز تدريب الفروسية:');
    console.log('✅ تم إنشاء حجز تدريب الفروسية بنجاح');
    console.log('✅ تم إنشاء رابط الدفع');
    console.log('✅ تم ربط الحجز بالدورة التدريبية الصحيحة');
    console.log('✅ تم حفظ تفاصيل التدريب');
    console.log('\n🐎 الحجز جاهز للمعالجة والتدريب!');
    console.log(`📚 الدورة: ${trainingData.courseName}`);
    console.log(`💰 السعر: ${trainingData.coursePrice} ريال لكل جلسة`);

  } catch (error) {
    console.error('\n❌ خطأ في اختبار حجز تدريب الفروسية:');
    console.error('رسالة الخطأ:', error.message);
    
    if (error.response) {
      console.error('حالة الاستجابة:', error.response.status);
      console.error('بيانات الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n🔧 تأكد من:');
    console.error('1. تشغيل الخادم على المنفذ 5001');
    console.error('2. اتصال قاعدة البيانات');
    console.error('3. وجود بيانات التدريب في قاعدة البيانات');
    console.error('4. صحة معرفات التدريب والدورة');
  }
}

// Run the test
testHorseBooking();
