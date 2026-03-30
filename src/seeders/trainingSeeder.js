import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Training from '../models/Training.js';

dotenv.config();

const seedTrainingData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing training data
    await Training.deleteMany({});
    console.log('Cleared existing training data');

    // Prepare training data
    const trainingData = [
      {
        category: 'children',
        name: 'الأطفال',
        nameEn: 'Children',
        description: 'برامج تدريبية مخصصة للأطفال من عمر 6 إلى 14 سنة',
        descriptionEn: 'Training programs for children aged 6 to 14 years',
        icon: '👶',
        courses: [
          {
            id: 'children-daily',
            name: 'حصة يومية',
            nameEn: 'Daily Session',
            price: 180,
            sessions: 1,
            duration: '1 ساعة',
            durationEn: '1 hour'
          },
          {
            id: 'children-8-sessions',
            name: '8 حصص تدريبية',
            nameEn: '8 Training Sessions',
            price: 1300,
            sessions: 8,
            duration: '8 ساعات',
            durationEn: '8 hours'
          },
          {
            id: 'children-12-sessions',
            name: '12 حصة تدريبية',
            nameEn: '12 Training Sessions',
            price: 1800,
            sessions: 12,
            duration: '12 ساعة',
            durationEn: '12 hours'
          },
          {
            id: 'children-12-individual',
            name: '12 حصة تدريبية فردية',
            nameEn: '12 Individual Training Sessions',
            price: 2300,
            sessions: 12,
            duration: '12 ساعة فردية',
            durationEn: '12 individual hours'
          }
        ],
        disabledDates: [
          { date: '2025-06-25', reason: 'maintenance', description: 'صيانة دورية' },
          { date: '2025-06-26', reason: 'maintenance', description: 'صيانة دورية' },
          { date: '2025-06-30', reason: 'maintenance', description: 'صيانة دورية' },
          { date: '2025-06-09', reason: 'maintenance', description: 'صيانة دورية' }
        ],
        timeSlots: {
          weekdays: ['17:00', '18:00', '19:00', '20:00'],
          weekends: ['16:00', '17:00', '18:00', '19:00', '20:00']
        }
      },
      {
        category: 'youth',
        name: 'الشباب',
        nameEn: 'Youth',
        description: 'برامج تدريبية للشباب من عمر 15 إلى ما فوق',
        descriptionEn: 'Training programs for youth aged 15 and above',
        icon: '👨‍🦱',
        courses: [
          {
            id: 'youth-daily',
            name: 'حصة يومية',
            nameEn: 'Daily Session',
            price: 200,
            sessions: 1,
            duration: '1.5 ساعة',
            durationEn: '1.5 hours'
          },
          {
            id: 'youth-10-sessions',
            name: '10 حصص تدريبية',
            nameEn: '10 Training Sessions',
            price: 1800,
            sessions: 10,
            duration: '15 ساعة',
            durationEn: '15 hours'
          }
        ],
        disabledDates: [
          { date: '2025-06-25', reason: 'maintenance', description: 'صيانة دورية' },
          { date: '2025-06-26', reason: 'maintenance', description: 'صيانة دورية' }
        ],
        timeSlots: {
          weekdays: ['17:00', '18:00', '19:00', '20:00'],
          weekends: ['16:00', '17:00', '18:00', '19:00', '20:00']
        }
      },
      {
        category: 'women',
        name: 'النساء',
        nameEn: 'Women',
        description: 'برامج تدريبية للنساء من جميع الأعمار',
        descriptionEn: 'Training programs for women of all ages',
        icon: '👩',
        courses: [
          {
            id: 'women-daily',
            name: 'حصة يومية',
            nameEn: 'Daily Session',
            price: 190,
            sessions: 1,
            duration: '1 ساعة',
            durationEn: '1 hour'
          },
          {
            id: 'women-group',
            name: 'حصص جماعية',
            nameEn: 'Group Sessions',
            price: 1500,
            sessions: 8,
            duration: '8 ساعات جماعية',
            durationEn: '8 group hours'
          }
        ],
        disabledDates: [
          { date: '2025-06-25', reason: 'maintenance', description: 'صيانة دورية' }
        ],
        timeSlots: {
          weekdays: ['17:00', '18:00', '19:00', '20:00'],
          weekends: ['16:00', '17:00', '18:00', '19:00', '20:00']
        }
      }
    ];

    // Insert training data
    const insertedTrainings = await Training.insertMany(trainingData);
    console.log(`Inserted ${insertedTrainings.length} training entries`);

    // Display created data summary
    console.log('\n🎯 Created Training Data Summary:');
    
    const categories = insertedTrainings.map(t => t.category);
    console.log(`📂 Categories: ${categories.join(', ')}`);
    
    const totalCourses = insertedTrainings.reduce((sum, t) => sum + t.courses.length, 0);
    console.log(`📚 Total Courses: ${totalCourses}`);
    
    const disabledDates = insertedTrainings.reduce((dates, t) => dates.concat(t.disabledDates), []);
    console.log(`❌ Disabled Dates: ${disabledDates.length}`);

    // Display sample data
    console.log('\n🎯 Sample Training Data:');
    insertedTrainings.forEach(training => {
      console.log(`\n${training.icon} ${training.name} (${training.nameEn}):`);
      console.log(`  📝 ${training.description}`);
      console.log(`  📅 ${training.courses.length} courses`);
      console.log(`  ⏰ ${training.timeSlots.weekdays.length} weekday slots, ${training.timeSlots.weekends.length} weekend slots`);
    });

    console.log('\n✅ Training seeding completed successfully!');
    console.log('\n💡 Test the Training API with:');
    console.log('   GET /api/training - Get all trainings');
    console.log('   GET /api/training/available-dates - Get available dates');
    console.log('   POST /api/training - Create new training');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding training data:', error);
    process.exit(1);
  }
};

// Run seeder
seedTrainingData();
