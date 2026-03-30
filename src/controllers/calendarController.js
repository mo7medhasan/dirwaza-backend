import Calendar from '../models/Calendar.js';
import Experience from '../models/Experience.js';

// GET /api/calendar/:experienceId - Get calendar data for specific experience
export const getCalendarData = async (req, res) => {
  try {
    const { experienceId } = req.params;
    
    let calendar = await Calendar.findOne({ experienceId }).populate('experienceId', 'title');
    
    // If no calendar exists, create default one
    if (!calendar) {
      calendar = await Calendar.create({
        experienceId,
        basePrice: 450,
        weekendPrice: 600,
        disabledDates: []
      });
      calendar = await Calendar.findById(calendar._id).populate('experienceId', 'title');
    }
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات التقويم', 
      error: error.message 
    });
  }
};

// POST /api/calendar - Create or update calendar data
export const createOrUpdateCalendar = async (req, res) => {
  try {
    const { experienceId, basePrice, weekendPrice, disabledDates } = req.body;
    
    if (!experienceId) {
      return res.status(400).json({
        success: false,
        message: 'معرف التجربة مطلوب'
      });
    }
    
    // Check if experience exists
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'التجربة غير موجودة'
      });
    }
    
    let calendar = await Calendar.findOne({ experienceId });
    
    if (calendar) {
      // Update existing calendar
      calendar.basePrice = basePrice || calendar.basePrice;
      calendar.weekendPrice = weekendPrice || calendar.weekendPrice;
      if (disabledDates !== undefined) {
        calendar.disabledDates = disabledDates;
      }
      await calendar.save();
    } else {
      // Create new calendar
      calendar = await Calendar.create({
        experienceId,
        basePrice: basePrice || 450,
        weekendPrice: weekendPrice || 600,
        disabledDates: disabledDates || []
      });
    }
    
    calendar = await Calendar.findById(calendar._id).populate('experienceId', 'title');
    
    res.json({
      success: true,
      message: calendar ? 'تم تحديث بيانات التقويم بنجاح' : 'تم إنشاء بيانات التقويم بنجاح',
      data: calendar
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء حفظ بيانات التقويم', 
      error: error.message 
    });
  }
};

// PUT /api/calendar/:id/prices - Update prices only
export const updatePrices = async (req, res) => {
  try {
    const { id } = req.params;
    const { basePrice, weekendPrice } = req.body;
    
    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'بيانات التقويم غير موجودة'
      });
    }
    
    if (basePrice !== undefined) calendar.basePrice = basePrice;
    if (weekendPrice !== undefined) calendar.weekendPrice = weekendPrice;
    
    await calendar.save();
    
    const updatedCalendar = await Calendar.findById(id).populate('experienceId', 'title');
    
    res.json({
      success: true,
      message: 'تم تحديث الأسعار بنجاح',
      data: updatedCalendar
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث الأسعار', 
      error: error.message 
    });
  }
};

// POST /api/calendar/:id/disabled-dates - Add disabled date
export const addDisabledDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, reason, description } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'التاريخ مطلوب'
      });
    }
    
    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'بيانات التقويم غير موجودة'
      });
    }
    
    // Check if date already exists
    const existingDate = calendar.disabledDates.find(d => 
      new Date(d.date).toDateString() === new Date(date).toDateString()
    );
    
    if (existingDate) {
      return res.status(400).json({
        success: false,
        message: 'التاريخ معطل بالفعل'
      });
    }
    
    calendar.disabledDates.push({
      date: new Date(date),
      reason: reason || 'other',
      description
    });
    
    await calendar.save();
    
    const updatedCalendar = await Calendar.findById(id).populate('experienceId', 'title');
    
    res.json({
      success: true,
      message: 'تم إضافة التاريخ المعطل بنجاح',
      data: updatedCalendar
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إضافة التاريخ المعطل', 
      error: error.message 
    });
  }
};

// DELETE /api/calendar/:id/disabled-dates/:dateId - Remove disabled date
export const removeDisabledDate = async (req, res) => {
  try {
    const { id, dateId } = req.params;
    
    const calendar = await Calendar.findById(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'بيانات التقويم غير موجودة'
      });
    }
    
    calendar.disabledDates = calendar.disabledDates.filter(d => 
      d._id.toString() !== dateId
    );
    
    await calendar.save();
    
    const updatedCalendar = await Calendar.findById(id).populate('experienceId', 'title');
    
    res.json({
      success: true,
      message: 'تم حذف التاريخ المعطل بنجاح',
      data: updatedCalendar
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء حذف التاريخ المعطل', 
      error: error.message 
    });
  }
};

// GET /api/calendar - Get all calendar data
export const getAllCalendars = async (req, res) => {
  try {
    const calendars = await Calendar.find({ isActive: true })
      .populate('experienceId', 'title type')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات التقويم', 
      error: error.message 
    });
  }
};

// DELETE /api/calendar/:id - Delete calendar data
export const deleteCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const calendar = await Calendar.findByIdAndDelete(id);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'بيانات التقويم غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف بيانات التقويم بنجاح'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء حذف بيانات التقويم', 
      error: error.message 
    });
  }
};

// GET /api/calendar/:experienceId/check-date/:date - Check if date is available
export const checkDateAvailability = async (req, res) => {
  try {
    const { experienceId, date } = req.params;
    
    const calendar = await Calendar.findOne({ experienceId });
    if (!calendar) {
      return res.json({
        success: true,
        available: true,
        price: 450, // default price
        isWeekend: false
      });
    }
    
    const checkDate = new Date(date);
    const isDisabled = calendar.disabledDates.some(d => 
      new Date(d.date).toDateString() === checkDate.toDateString()
    );
    
    // Check if it's weekend (Friday & Saturday in Arab countries)
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday = 5, Saturday = 6
    
    const price = isWeekend ? calendar.weekendPrice : calendar.basePrice;
    
    res.json({
      success: true,
      available: !isDisabled,
      price,
      isWeekend,
      disabledReason: isDisabled ? 
        calendar.disabledDates.find(d => 
          new Date(d.date).toDateString() === checkDate.toDateString()
        )?.reason : null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء فحص توفر التاريخ', 
      error: error.message 
    });
  }
};
