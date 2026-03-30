import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dirwaza');

const plantSchema = new mongoose.Schema({}, { strict: false });
const Plant = mongoose.model('Plant', plantSchema);

const testIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];

async function checkPlants() {
  try {
    console.log('🔍 Checking plants in database...');
    console.log('Test IDs:', testIds);
    
    const plants = await Plant.find({ _id: { $in: testIds } });
    
    console.log('\n📊 Results:');
    console.log('Found plants:', plants.length);
    console.log('Expected plants:', testIds.length);
    
    if (plants.length > 0) {
      console.log('\n🌱 Found plants:');
      plants.forEach(plant => {
        console.log(`- ID: ${plant._id.toString()}`);
        console.log(`  Name: ${plant.name}`);
        console.log(`  Price: ${plant.price} ريال`);
        console.log('');
      });
    }
    
    if (plants.length !== testIds.length) {
      console.log('⚠️  Missing plants detected!');
      const foundIds = plants.map(p => p._id.toString());
      const missing = testIds.filter(id => !foundIds.includes(id));
      console.log('Missing IDs:', missing);
      
      // Check all plants in database
      const allPlants = await Plant.find({});
      console.log('\n📋 All plants in database:');
      allPlants.forEach(plant => {
        console.log(`- ${plant._id.toString()}: ${plant.name}`);
      });
    } else {
      console.log('✅ All test plants found successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkPlants();
