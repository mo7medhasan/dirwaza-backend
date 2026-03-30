import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Rest from './src/models/Rest.js';

dotenv.config();

const seedRestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding...');

    // Clear existing rest data
    await Rest.deleteMany({});
    console.log('Cleared existing rest data');

    // Sample rest data
    const sampleRests = [
      {
        name: "The Green House",
        title: "The Green House",
        description: "استراحة مميزة مناسبة للعائلات الكبيرة",
        rating: 4.8,
        images: ["/images/resort1.jpg"],
        features: ["غرفة سائق", "ألعاب مائية", "اربع غرف نوم"],
        amenities: [
          { icon: "BedDouble", label: "أربع غرف نوم" },
          { icon: "Bath", label: "5 دورات مياه" },
          { icon: "Users", label: "غرفة سائق" },
          { icon: "Waves", label: "ألعاب مائية" }
        ],
        price: 2500,
        location: "الرياض، حي الملقا",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/green-house"
      },
      {
        name: "The Long",
        title: "The Long",
        description: "استراحة واسعة مناسبة للعائلات المتوسطة",
        rating: 4.6,
        images: ["/images/resort2.jpg"],
        features: ["ثلاث غرف نوم", "مسبح مفتوح", "مكان للشواء"],
        amenities: [
          { icon: "BedDouble", label: "ثلاث غرف نوم" },
          { icon: "Bath", label: "4 دورات مياه" },
          { icon: "Pool", label: "مسبح مفتوح" },
          { icon: "Flame", label: "منطقة شواء" }
        ],
        price: 2000,
        location: "الرياض، حي العليا",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/the-long"
      },
      {
        name: "Tiny House",
        title: "Tiny House",
        description: "استراحة مثالية للعائلات الصغيرة",
        rating: 4.5,
        images: ["/images/resort3.jpg", "/images/rest-images/main.jpg"],
        features: ["غرفتين نوم", "ألعاب أطفال", "مطبخ تحضيري"],
        amenities: [
          { icon: "BedDouble", label: "غرفتين نوم" },
          { icon: "Bath", label: "3 دورات مياه" },
          { icon: "Dumbbell", label: "صالة طعام" },
          { icon: "CookingPot", label: "مطبخين" },
          { icon: "Users", label: "جلستين خارجين" },
          { icon: "Flame", label: "منطقة شواء" }
        ],
        price: 1800,
        location: "الرياض، حي النرجس",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/tiny-house"
      }
    ];

    // Insert rest data
    const createdRests = await Rest.insertMany(sampleRests);
    console.log(`✅ Successfully added ${createdRests.length} rests to database:`);
    
    createdRests.forEach((rest, index) => {
      console.log(`${index + 1}. ${rest.title} - ${rest.price} SAR - ${rest.location}`);
    });

    console.log('\n🎉 Rest data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding rest data:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
seedRestData();
