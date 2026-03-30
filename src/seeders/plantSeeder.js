import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Plant from '../models/Plant.js';
import { mockPlantsData } from '../utils/mockPlantData.js';

dotenv.config();

const seedPlantData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing plant data
    await Plant.deleteMany({});
    console.log('Cleared existing plant data');

    // Prepare plant data for seeding (remove id field, add additional data)
    const plantsToSeed = mockPlantsData.map(plant => {
      const { id, ...plantData } = plant; // Remove id field as MongoDB will generate _id
      return {
        ...plantData,
        // Add some additional variety to the data
        stock: Math.floor(Math.random() * 20) + 5, // Random stock between 5-25
        isActive: true
      };
    });

    // Add some extra plants for variety
    const additionalPlants = [
      {
        name: "نبات الصبار",
        nameEn: "Aloe Vera Plant",
        price: 85,
        image: "/images/plants/aloe-vera.jpg",
        description: "نبات طبي مفيد وسهل العناية",
        descriptionEn: "Beneficial medical plant that's easy to care for",
        isAvailable: true,
        category: "succulent",
        careLevel: "easy",
        lightRequirement: "high",
        wateringFrequency: "biweekly",
        stock: 15,
        tags: ["succulent", "medical", "easy-care"],
        isActive: true
      },
      {
        name: "نبات البوتس",
        nameEn: "Pothos Plant",
        price: 95,
        image: "/images/plants/pothos.jpg",
        description: "نبات متسلق جميل ومقاوم",
        descriptionEn: "Beautiful climbing plant that's very resilient",
        isAvailable: true,
        isOnSale: true,
        originalPrice: 130,
        category: "indoor",
        careLevel: "easy",
        lightRequirement: "low",
        wateringFrequency: "weekly",
        stock: 18,
        tags: ["indoor", "climbing", "low-light"],
        isActive: true
      },
      {
        name: "نبات الفيكس",
        nameEn: "Ficus Plant",
        price: 200,
        image: "/images/plants/ficus.jpg",
        description: "شجرة داخلية كبيرة وأنيقة",
        descriptionEn: "Large and elegant indoor tree",
        isAvailable: true,
        category: "tree",
        careLevel: "medium",
        lightRequirement: "high",
        wateringFrequency: "weekly",
        stock: 8,
        tags: ["tree", "large", "statement-plant"],
        isActive: true
      },
      {
        name: "نبات اللافندر",
        nameEn: "Lavender Plant",
        price: 75,
        image: "/images/plants/lavender.jpg",
        description: "نبات عطري جميل ومهدئ",
        descriptionEn: "Beautiful aromatic and calming plant",
        isAvailable: true,
        category: "herb",
        careLevel: "medium",
        lightRequirement: "high",
        wateringFrequency: "weekly",
        stock: 12,
        tags: ["herb", "aromatic", "calming", "outdoor"],
        isActive: true
      },
      {
        name: "نبات الورد الجوري",
        nameEn: "Rose Plant",
        price: 150,
        image: "/images/plants/rose.jpg",
        description: "وردة جميلة ذات رائحة عطرة",
        descriptionEn: "Beautiful rose with fragrant scent",
        isAvailable: false, // Out of stock
        category: "flowering",
        careLevel: "hard",
        lightRequirement: "high",
        wateringFrequency: "daily",
        stock: 0,
        tags: ["flowering", "fragrant", "outdoor"],
        isActive: true
      }
    ];

    // Combine original data with additional plants
    const allPlantsData = [...plantsToSeed, ...additionalPlants];

    // Insert plant data
    const insertedPlants = await Plant.insertMany(allPlantsData);
    console.log(`Inserted ${insertedPlants.length} plant entries`);

    // Display created data summary
    console.log('\n🌱 Created Plant Data Summary:');
    
    const categories = await Plant.distinct('category');
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
    const availableCount = await Plant.countDocuments({ isAvailable: true });
    const onSaleCount = await Plant.countDocuments({ isOnSale: true });
    const totalStock = await Plant.aggregate([
      { $group: { _id: null, totalStock: { $sum: '$stock' } } }
    ]);
    
    console.log(`✅ Available Plants: ${availableCount}/${insertedPlants.length}`);
    console.log(`🏷️  Plants on Sale: ${onSaleCount}`);
    console.log(`📦 Total Stock: ${totalStock[0]?.totalStock || 0} units`);

    // Display sample plants
    console.log('\n🌿 Sample Plants:');
    const samplePlants = await Plant.find().limit(5);
    samplePlants.forEach(plant => {
      const saleInfo = plant.isOnSale ? ` (SALE: ${plant.originalPrice}→${plant.price}ر.س)` : '';
      const availabilityInfo = plant.isAvailable ? '✅' : '❌';
      console.log(`${availabilityInfo} ${plant.name} - ${plant.price}ر.س${saleInfo} [${plant.category}]`);
    });

    console.log('\n✅ Plant seeding completed successfully!');
    console.log('\n💡 Test the Plant API with:');
    console.log('   GET /api/plants - Get all plants');
    console.log('   GET /api/plants/categories - Get categories');
    console.log('   GET /api/plants/featured - Get featured plants');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plant data:', error);
    process.exit(1);
  }
};

// Run seeder
seedPlantData();
