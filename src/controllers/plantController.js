import Plant from '../models/Plant.js';

// GET /api/plants - Get all plants with filtering and pagination
export const getAllPlants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      isAvailable,
      isOnSale,
      careLevel,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (isOnSale !== undefined) filter.isOnSale = isOnSale === 'true';
    if (careLevel) filter.careLevel = careLevel;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { descriptionEn: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const plants = await Plant.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Plant.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: plants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب النباتات', 
      error: error.message 
    });
  }
};

// GET /api/plants/:id - Get single plant by ID
export const getPlantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plant = await Plant.findById(id);
    if (!plant || !plant.isActive) {
      return res.status(404).json({
        success: false,
        message: 'النبات غير موجود'
      });
    }

    res.json({
      success: true,
      data: plant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب النبات', 
      error: error.message 
    });
  }
};

// POST /api/plants - Create new plant
export const createPlant = async (req, res) => {
  try {
    const plantData = new Plant({
      ...req.body,
      owner: req.user.id,
      contactPhone: req.user.phone
    });

    // Validate required fields
    const requiredFields = ['name', 'nameEn', 'price', 'image', 'description', 'descriptionEn'];
    for (const field of requiredFields) {
      if (!plantData[field]) {
        return res.status(400).json({
          success: false,
          message: `الحقل ${field} مطلوب`
        });
      }
    }

    const plant = await Plant.create(plantData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء النبات بنجاح',
      data: plant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء النبات', 
      error: error.message 
    });
  }
};

// PUT /api/plants/:id - Update plant
export const updatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'النبات غير موجود'
      });
    }

    // Update plant data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        plant[key] = updateData[key];
      }
    });

    await plant.save();

    res.json({
      success: true,
      message: 'تم تحديث النبات بنجاح',
      data: plant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث النبات', 
      error: error.message 
    });
  }
};

// DELETE /api/plants/:id - Delete plant (soft delete)
export const deletePlant = async (req, res) => {
  try {
    const { id } = req.params;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'النبات غير موجود'
      });
    }

    // Soft delete by setting isActive to false
    plant.isActive = false;
    await plant.save();

    res.json({
      success: true,
      message: 'تم حذف النبات بنجاح'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء حذف النبات', 
      error: error.message 
    });
  }
};

// PUT /api/plants/:id/availability - Toggle plant availability
export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'النبات غير موجود'
      });
    }

    plant.isAvailable = isAvailable !== undefined ? isAvailable : !plant.isAvailable;
    await plant.save();

    res.json({
      success: true,
      message: `تم ${plant.isAvailable ? 'تفعيل' : 'إلغاء'} توفر النبات بنجاح`,
      data: plant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث توفر النبات', 
      error: error.message 
    });
  }
};

// PUT /api/plants/:id/sale - Toggle plant sale status
export const toggleSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnSale, originalPrice } = req.body;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'النبات غير موجود'
      });
    }

    plant.isOnSale = isOnSale !== undefined ? isOnSale : !plant.isOnSale;
    
    if (plant.isOnSale && originalPrice) {
      plant.originalPrice = originalPrice;
    } else if (!plant.isOnSale) {
      plant.originalPrice = undefined;
    }

    await plant.save();

    res.json({
      success: true,
      message: `تم ${plant.isOnSale ? 'تفعيل' : 'إلغاء'} تخفيض النبات بنجاح`,
      data: plant
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة التخفيض', 
      error: error.message 
    });
  }
};

// GET /api/plants/categories - Get all plant categories
export const getPlantCategories = async (req, res) => {
  try {
    const categories = await Plant.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب فئات النباتات', 
      error: error.message 
    });
  }
};

// GET /api/plants/featured - Get featured plants (on sale or top-rated)
export const getFeaturedPlants = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const featuredPlants = await Plant.find({
      isActive: true,
      isAvailable: true,
      $or: [
        { isOnSale: true },
        { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } // New plants (last 30 days)
      ]
    })
    .sort({ isOnSale: -1, createdAt: -1 })
    .limit(Number(limit));

    res.json({
      success: true,
      data: featuredPlants
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب النباتات المميزة', 
      error: error.message 
    });
  }
};
