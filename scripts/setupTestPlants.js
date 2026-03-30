import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza');

// Plant schema (basic structure)
const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  description: { type: String },
  descriptionEn: { type: String },
  category: { type: String, default: 'indoor' },
  careLevel: { type: String, default: 'easy' },
  lightRequirement: { type: String, default: 'medium' },
  wateringFrequency: { type: String, default: 'weekly' },
  stock: { type: Number, default: 10 },
  tags: [String],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const Plant = mongoose.model('Plant', plantSchema);

// Test plants data
const testPlants = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'نبات الصبار الجميل',
    nameEn: 'Beautiful Cactus Plant',
    price: 75.50,
    image: '/images/plants/cactus.jpg',
    description: 'نبات صبار جميل ومقاوم للجفاف، مثالي للمبتدئين',
    descriptionEn: 'Beautiful drought-resistant cactus plant, perfect for beginners',
    category: 'indoor',
    careLevel: 'easy',
    lightRequirement: 'high',
    wateringFrequency: 'monthly',
    stock: 15,
    tags: ['indoor', 'cactus', 'low-maintenance'],
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    name: 'نبات الورد الأحمر',
    nameEn: 'Red Rose Plant',
    price: 120.00,
    image: '/images/plants/red-rose.jpg',
    description: 'نبات ورد أحمر جميل برائحة عطرة',
    descriptionEn: 'Beautiful red rose plant with fragrant blooms',
    category: 'outdoor',
    careLevel: 'medium',
    lightRequirement: 'high',
    wateringFrequency: 'weekly',
    stock: 8,
    tags: ['outdoor', 'roses', 'fragrant'],
    isAvailable: true
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'نبات اللافندر',
    nameEn: 'Lavender Plant',
    price: 95.00,
    image: '/images/plants/lavender.jpg',
    description: 'نبات اللافندر العطري المهدئ',
    descriptionEn: 'Aromatic and calming lavender plant',
    category: 'outdoor',
    careLevel: 'easy',
    lightRequirement: 'high',
    wateringFrequency: 'weekly',
    stock: 12,
    tags: ['outdoor', 'aromatic', 'calming'],
    isAvailable: true
  }
];

async function setupTestPlants() {
  try {
    console.log('🌱 إعداد نباتات الاختبار...');
    
    // Clear existing plants
    await Plant.deleteMany({});
    console.log('✅ تم حذف النباتات الموجودة');
    
    // Insert test plants
    const insertedPlants = await Plant.insertMany(testPlants);
    console.log(`✅ تم إضافة ${insertedPlants.length} نباتات للاختبار`);
    
    console.log('\n🌿 النباتات المضافة:');
    insertedPlants.forEach((plant, index) => {
      console.log(`${index + 1}. ${plant.name} - ${plant.price} ريال (ID: ${plant._id})`);
    });
    
    console.log('\n🎉 تم إعداد نباتات الاختبار بنجاح!');
    console.log('يمكنك الآن تشغيل اختبار حجز النباتات مع Apple Pay');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد النباتات:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

setupTestPlants();
