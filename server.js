import app from './src/app.js';
import dotenv from 'dotenv';
import formData from 'express-form-data';
import { connectMongo } from './src/db.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

app.use(formData.parse());

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
