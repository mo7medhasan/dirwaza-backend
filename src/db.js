import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;
  if (mongoose.connections[0].readyState) {
    isConnected = true;
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}
