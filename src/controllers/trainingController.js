import Training from '../models/Training.js';
import languageService from '../services/languageService.js';

// Get all training categories
export const getAllTrainings = async (req, res) => {
  try {
    const { category, isActive, sortBy, sortOrder } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.category = 1;
    }
    
    const trainings = await Training.find(query)
      .sort(sort)
      .select('-__v');
    
    res.json({
      success: true,
      message: languageService.getText('common.success', req.language),
      data: trainings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Get training by ID
export const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .select('-__v');
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('training.notFound', req.language)
      });
    }
    
    res.json({
      success: true,
      message: languageService.getText('common.success', req.language),
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Create or update training
export const createOrUpdateTraining = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate required fields
    const requiredFields = ['category', 'name', 'nameEn', 'description', 'descriptionEn', 'icon', 'courses'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: languageService.getText('validation.required', req.language, {
          field: missingFields.join(', ')
        })
      });
    }
    
    let training;
    if (id) {
      // Update existing training
      training = await Training.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
      if (!training) {
        return res.status(404).json({
          success: false,
          message: languageService.getText('training.notFound', req.language)
        });
      }
    } else {
      // Create new training
      training = await Training.create(req.body);
    }
    
    res.json({
      success: true,
      message: languageService.getText('training.created', req.language),
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Update training status (active/inactive)
export const toggleTrainingStatus = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('training.notFound', req.language)
      });
    }
    
    training.isActive = req.body.isActive;
    await training.save();
    
    res.json({
      success: true,
      message: languageService.getText('training.statusUpdated', req.language, {
        status: training.isActive ? 'نشط' : 'غير نشط'
      }),
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Add disabled date
export const addDisabledDate = async (req, res) => {
  try {
    const { date, reason, description } = req.body;
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('training.notFound', req.language)
      });
    }
    
    // Check if date is already disabled
    const existingDisabled = training.disabledDates.find(d => d.date === date);
    if (existingDisabled) {
      return res.status(400).json({
        success: false,
        message: languageService.getText('training.dateAlreadyDisabled', req.language)
      });
    }
    
    training.disabledDates.push({ date, reason, description });
    await training.save();
    
    res.json({
      success: true,
      message: languageService.getText('training.dateDisabled', req.language),
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Remove disabled date
export const removeDisabledDate = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('training.notFound', req.language)
      });
    }
    
    training.disabledDates = training.disabledDates.filter(
      date => date.date !== req.params.date
    );
    await training.save();
    
    res.json({
      success: true,
      message: languageService.getText('training.dateEnabled', req.language),
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};

// Get available dates and time slots
export const getAvailableDates = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const trainings = await Training.find(query)
      .select('category name nameEn disabledDates timeSlots');
    
    const availableDates = trainings.map(training => ({
      category: training.category,
      name: training.name,
      nameEn: training.nameEn,
      dates: training.availableDates
    }));
    
    res.json({
      success: true,
      message: languageService.getText('common.success', req.language),
      data: availableDates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('common.serverError', req.language),
      error: error.message
    });
  }
};
