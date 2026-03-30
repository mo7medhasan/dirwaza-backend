import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Calendar from '../models/Calendar.js';
import Experience from '../models/Experience.js';

dotenv.config();

const seedCalendarData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing calendar data
    await Calendar.deleteMany({});
    console.log('Cleared existing calendar data');

    // Get all experiences
    const experiences = await Experience.find({});
    
    if (experiences.length === 0) {
      console.log('No experiences found. Please seed experiences first.');
      process.exit(1);
    }

    // Create sample disabled dates (next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const sampleDisabledDates = [
      {
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5),
        reason: 'maintenance',
        description: 'صيانة دورية'
      },
      {
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15),
        reason: 'booked',
        description: 'محجوز مسبقاً'
      },
      {
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 25),
        reason: 'closed',
        description: 'إجازة رسمية'
      }
    ];

    // Create calendar data for each experience
    const calendarData = experiences.map((experience, index) => ({
      experienceId: experience._id,
      basePrice: 450 + (index * 50), // Different prices for variety
      weekendPrice: 600 + (index * 75),
      disabledDates: index === 0 ? sampleDisabledDates : [], // Only add disabled dates to first experience
      isActive: true
    }));

    // Insert calendar data
    const insertedCalendars = await Calendar.insertMany(calendarData);
    console.log(`Inserted ${insertedCalendars.length} calendar entries`);

    // Display created data
    console.log('\n📅 Created Calendar Data:');
    for (const calendar of insertedCalendars) {
      const populatedCalendar = await Calendar.findById(calendar._id).populate('experienceId', 'title');
      console.log(`- ${populatedCalendar.experienceId?.title || 'Unknown'}: Base: ${calendar.basePrice}ر.س, Weekend: ${calendar.weekendPrice}ر.س, Disabled: ${calendar.disabledDates.length} dates`);
    }

    console.log('\n✅ Calendar seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding calendar data:', error);
    process.exit(1);
  }
};

// Run seeder
seedCalendarData();
