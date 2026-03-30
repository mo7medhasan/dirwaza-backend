import Experience from '../models/Experience.js';

// GET /api/experiences (للجميع)
export const getExperiences = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    const experiences = await Experience.find(filter);
    res.json({ success: true, data: experiences, total: experiences.length });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التجارب', error: error.message });
  }
};

// GET /api/experiences/all (للأدمن: كل التجارب)
export const getAllExperiences = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const experiences = await Experience.find(filter);
    res.json({ success: true, data: experiences, total: experiences.length });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التجارب', error: error.message });
  }
};

// GET /api/experiences/:id
export const getExperienceById = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ message: 'التجربة غير موجودة' });
    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب التجربة', error: error.message });
  }
};

// POST /api/experiences (إضافة)
export const createExperience = async (req, res) => {
  try {
    const { title, type, description, price, images, availableDates, isActive } = req.body;
    if (!title || !type || !price) {
      return res.status(400).json({ message: 'يرجى تعبئة الحقول الأساسية' });
    }
    const experience = await Experience.create({ title, type, description, price, images, availableDates, isActive });
    res.status(201).json({ message: 'تمت إضافة التجربة بنجاح', experience });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة التجربة', error: error.message });
  }
};

// PUT /api/experiences/:id (تعديل)
export const updateExperience = async (req, res) => {
  try {
    const { title, type, description, price, images, availableDates, isActive } = req.body;
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ message: 'التجربة غير موجودة' });
    if (title) experience.title = title;
    if (type) experience.type = type;
    if (description) experience.description = description;
    if (price) experience.price = price;
    if (images) experience.images = images;
    if (availableDates) experience.availableDates = availableDates;
    if (typeof isActive === 'boolean') experience.isActive = isActive;
    await experience.save();
    res.json({ message: 'تم تحديث التجربة', experience });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث التجربة', error: error.message });
  }
};

// DELETE /api/experiences/:id (حذف)
export const deleteExperience = async (req, res) => {
  try {
    const experience = await Experience.findByIdAndDelete(req.params.id);
    if (!experience) return res.status(404).json({ message: 'التجربة غير موجودة' });
    res.json({ message: 'تم حذف التجربة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف التجربة', error: error.message });
  }
};
