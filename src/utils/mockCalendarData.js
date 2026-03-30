// Mock Calendar Data Structure
// This matches the structure you requested

export const mockCalendarData = {
  basePrice: 450,
  weekendPrice: 600,
  
  // Disabled dates (e.g., already booked or maintenance)
  disabledDates: [
    // Examples - these will be managed via API
    // "2024-12-25", // Christmas
    // "2024-01-01", // New Year
  ],
};

// Helper function to check if date is weekend (Friday & Saturday in Arab countries)
export const isWeekendDate = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 5 || dayOfWeek === 6; // Friday = 5, Saturday = 6
};

// Helper function to get price for specific date
export const getPriceForDate = (date, calendarData = mockCalendarData) => {
  return isWeekendDate(date) ? calendarData.weekendPrice : calendarData.basePrice;
};

// Helper function to check if date is disabled
export const isDateDisabled = (date, calendarData = mockCalendarData) => {
  const dateString = new Date(date).toISOString().split('T')[0];
  return calendarData.disabledDates.includes(dateString);
};

// Helper function to format calendar data for frontend
export const formatCalendarForFrontend = (calendarData) => {
  return {
    basePrice: calendarData.basePrice,
    weekendPrice: calendarData.weekendPrice,
    disabledDates: calendarData.disabledDates.map(item => ({
      date: item.date,
      reason: item.reason || 'other',
      description: item.description || ''
    })),
    isActive: calendarData.isActive
  };
};

export default mockCalendarData;
