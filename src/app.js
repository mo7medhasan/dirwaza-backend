import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import formData from 'express-form-data';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));
// Only apply formData.parse() to non-GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  formData.parse()(req, res, next);
});
// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import calendarRouter from './routes/calendar.js';
import contactRouter from './routes/contact.js';
import contactInfoRouter from './routes/contactInfo.js';
import dashboardRouter from './routes/dashboard.js';
import experiencesRouter from './routes/experiences.js';
import otpRouter from './routes/otp.js';
import paymentRouter from './routes/payment.js';
import plantsRouter from './routes/plants.js';
import restRouter from './routes/restRoutes.js';
import trainingRouter from './routes/training.js';
import userRouter from './routes/user.js';
app.use('/api/experiences', experiencesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/contact', contactRouter);
app.use('/api/contact-info', contactInfoRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/otp', otpRouter);
app.use('/api/plants', plantsRouter);
app.use('/api/training', trainingRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/rests', restRouter);

app.get('/', (req, res) => {
  res.send('Dirwaza Backend API');
});

export default app;
