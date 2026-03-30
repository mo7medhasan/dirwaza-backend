import Rest from '../models/Rest.js';

// الحصول على جميع الاستراحات
export const getAllRests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, minPrice, maxPrice, location } = req.query;
    
    const query = { isActive: true };
    
    // البحث النصي
    if (search) {
      query.$text = { $search: search };
    }
    
    // فلترة بالسعر
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // فلترة بالموقع
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const skip = (page - 1) * limit;
    const rests = await Rest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Rest.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      rests,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRests: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الاستراحات', error: error.message });
  }
};

// الحصول على استراحة واحدة
export const getRestById = async (req, res) => {
  try {
    const { id } = req.params;
    const rest = await Rest.findById(id);
    
    if (!rest || !rest.isActive) {
      return res.status(404).json({ message: 'الاستراحة غير موجودة' });
    }
    
    res.status(200).json(rest);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الاستراحة', error: error.message });
  }
};

// الحصول على استراحة بواسطة الرابط
export const getRestByHref = async (req, res) => {
  try {
    const { href } = req.params;
    const rest = await Rest.findOne({ href: `/rest/${href}`, isActive: true });
    
    if (!rest) {
      return res.status(404).json({ message: 'الاستراحة غير موجودة' });
    }
    
    res.status(200).json(rest);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الاستراحة', error: error.message });
  }
};

// إنشاء استراحة جديدة
export const createRest = async (req, res) => {
  try {
    const restData = req.body;
    
    // التحقق من البيانات المطلوبة
    const requiredFields = ['name', 'title', 'description', 'price', 'location', 'href'];
    for (const field of requiredFields) {
      if (!restData[field]) {
        return res.status(400).json({ message: `${field} مطلوب` });
      }
    }
    
    // التحقق من عدم تكرار الرابط
    const existingRest = await Rest.findOne({ href: restData.href });
    if (existingRest) {
      return res.status(400).json({ message: 'الرابط مستخدم بالفعل' });
    }
    
    const rest = await Rest.create(restData);
    res.status(201).json({ message: 'تم إنشاء الاستراحة بنجاح', rest });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الاستراحة', error: error.message });
  }
};

// تحديث استراحة
export const updateRest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const rest = await Rest.findById(id);
    if (!rest) {
      return res.status(404).json({ message: 'الاستراحة غير موجودة' });
    }
    
    // التحقق من عدم تكرار الرابط إذا تم تحديثه
    if (updateData.href && updateData.href !== rest.href) {
      const existingRest = await Rest.findOne({ href: updateData.href });
      if (existingRest) {
        return res.status(400).json({ message: 'الرابط مستخدم بالفعل' });
      }
    }
    
    const updatedRest = await Rest.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    res.status(200).json({ message: 'تم تحديث الاستراحة بنجاح', rest: updatedRest });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث الاستراحة', error: error.message });
  }
};

// حذف استراحة (حذف ناعم)
export const deleteRest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rest = await Rest.findById(id);
    if (!rest) {
      return res.status(404).json({ message: 'الاستراحة غير موجودة' });
    }
    
    await Rest.findByIdAndUpdate(id, { isActive: false });
    res.status(200).json({ message: 'تم حذف الاستراحة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الاستراحة', error: error.message });
  }
};

// استعادة استراحة محذوفة
export const restoreRest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rest = await Rest.findById(id);
    if (!rest) {
      return res.status(404).json({ message: 'الاستراحة غير موجودة' });
    }
    
    await Rest.findByIdAndUpdate(id, { isActive: true });
    res.status(200).json({ message: 'تم استعادة الاستراحة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء استعادة الاستراحة', error: error.message });
  }
};

// إضافة بيانات العينة
export const seedRestData = async (req, res) => {
  try {
    // حذف البيانات الموجودة
    await Rest.deleteMany({});
    
    const sampleRests = [
      {
        name: "The Green House",
        title: "The Green House",
        description: "استراحة مميزة مناسبة للعائلات الكبيرة",
        rating: 4.8,
        images: ["/images/resort1.jpg"],
        features: ["غرفة سائق", "ألعاب مائية", "اربع غرف نوم"],
        amenities: [
          { icon: "BedDouble", label: "أربع غرف نوم" },
          { icon: "Bath", label: "5 دورات مياه" },
          { icon: "Users", label: "غرفة سائق" },
          { icon: "Waves", label: "ألعاب مائية" }
        ],
        price: 2500,
        location: "الرياض، حي الملقا",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/green-house"
      },
      {
        name: "The Long",
        title: "The Long",
        description: "استراحة واسعة مناسبة للعائلات المتوسطة",
        rating: 4.6,
        images: ["/images/resort2.jpg"],
        features: ["ثلاث غرف نوم", "مسبح مفتوح", "مكان للشواء"],
        amenities: [
          { icon: "BedDouble", label: "ثلاث غرف نوم" },
          { icon: "Bath", label: "4 دورات مياه" },
          { icon: "Pool", label: "مسبح مفتوح" },
          { icon: "Flame", label: "منطقة شواء" }
        ],
        price: 2000,
        location: "الرياض، حي العليا",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/the-long"
      },
      {
        name: "Tiny House",
        title: "Tiny House",
        description: "استراحة مثالية للعائلات الصغيرة",
        rating: 4.5,
        images: ["/images/resort3.jpg", "/images/rest-images/main.jpg"],
        features: ["غرفتين نوم", "ألعاب أطفال", "مطبخ تحضيري"],
        amenities: [
          { icon: "BedDouble", label: "غرفتين نوم" },
          { icon: "Bath", label: "3 دورات مياه" },
          { icon: "Dumbbell", label: "صالة طعام" },
          { icon: "CookingPot", label: "مطبخين" },
          { icon: "Users", label: "جلستين خارجين" },
          { icon: "Flame", label: "منطقة شواء" }
        ],
        price: 1800,
        location: "الرياض، حي النرجس",
        availability: {
          overnight: { checkIn: "15:00", checkOut: "12:00" },
          withoutOvernight: { checkIn: "08:00", checkOut: "18:00" }
        },
        href: "/rest/tiny-house"
      }
    ];
    
    const createdRests = await Rest.insertMany(sampleRests);
    res.status(201).json({ 
      message: 'تم إضافة بيانات العينة بنجاح',
      count: createdRests.length,
      rests: createdRests
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة بيانات العينة', error: error.message });
  }
};
