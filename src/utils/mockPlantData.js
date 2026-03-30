// Mock Plant Data Structure
// This matches the structure you requested

export const mockPlantsData = [
  {
    id: 1,
    name: "نبات مونستيرا",
    nameEn: "Monstera Plant",
    price: 120,
    image: "/images/plants/monstera.jpg",
    description: "نبات داخلي جميل بأوراق فريدة",
    descriptionEn: "Beautiful indoor plant with unique leaf patterns",
    isAvailable: true,
    category: "indoor",
    careLevel: "easy",
    lightRequirement: "medium",
    wateringFrequency: "weekly",
    stock: 15,
    tags: ["indoor", "decorative", "air-purifier"]
  },
  {
    id: 2,
    name: "نبات الثعبان",
    nameEn: "Snake Plant",
    price: 120,
    image: "/images/plants/snake-plant.jpg",
    description: "نبات داخلي سهل العناية مع خصائص تنقية الهواء",
    descriptionEn: "Low maintenance indoor plant with air purifying qualities",
    isAvailable: true,
    category: "indoor",
    careLevel: "easy",
    lightRequirement: "low",
    wateringFrequency: "biweekly",
    stock: 20,
    tags: ["indoor", "air-purifier", "low-light"]
  },
  {
    id: 3,
    name: "نبات الدفنباخية",
    nameEn: "Dieffenbachia Plant",
    price: 60,
    image: "/images/plants/dieffenbachia.jpg",
    description: "نبات استوائي بأوراق مبرقشة جميلة",
    descriptionEn: "Tropical plant with beautiful variegated leaves",
    isAvailable: true,
    isOnSale: true,
    originalPrice: 90,
    category: "indoor",
    careLevel: "medium",
    lightRequirement: "medium",
    wateringFrequency: "weekly",
    stock: 8,
    tags: ["indoor", "tropical", "variegated"]
  },
  {
    id: 4,
    name: "نبات الثعبان",
    nameEn: "Snake Plant",
    price: 120,
    image: "/images/plants/snake-plant.jpg",
    description: "نبات داخلي سهل العناية مع خصائص تنقية الهواء",
    descriptionEn: "Low maintenance indoor plant with air purifying qualities",
    isAvailable: false,
    category: "indoor",
    careLevel: "easy",
    lightRequirement: "low",
    wateringFrequency: "biweekly",
    stock: 0,
    tags: ["indoor", "air-purifier", "low-light"]
  },
  {
    id: 5,
    name: "نبات الدفنباخية",
    nameEn: "Dieffenbachia Plant",
    price: 60,
    image: "/images/plants/dieffenbachia.jpg",
    description: "نبات استوائي بأوراق مبرقشة جميلة",
    descriptionEn: "Tropical plant with beautiful variegated leaves",
    isAvailable: true,
    isOnSale: true,
    originalPrice: 90,
    category: "indoor",
    careLevel: "medium",
    lightRequirement: "medium",
    wateringFrequency: "weekly",
    stock: 12,
    tags: ["indoor", "tropical", "variegated"]
  }
];

// Helper function to get available plants
export const getAvailablePlants = () => {
  return mockPlantsData.filter(plant => plant.isAvailable);
};

// Helper function to get plants on sale
export const getPlantsOnSale = () => {
  return mockPlantsData.filter(plant => plant.isOnSale);
};

// Helper function to get plants by category
export const getPlantsByCategory = (category) => {
  return mockPlantsData.filter(plant => plant.category === category);
};

// Helper function to search plants
export const searchPlants = (query) => {
  const searchTerm = query.toLowerCase();
  return mockPlantsData.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm) ||
    plant.nameEn.toLowerCase().includes(searchTerm) ||
    plant.description.toLowerCase().includes(searchTerm) ||
    plant.descriptionEn.toLowerCase().includes(searchTerm) ||
    plant.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

// Helper function to get plant categories
export const getPlantCategories = () => {
  const categories = [...new Set(mockPlantsData.map(plant => plant.category))];
  return categories;
};

// Helper function to format plant data for frontend
export const formatPlantForFrontend = (plant) => {
  return {
    id: plant._id || plant.id,
    name: plant.name,
    nameEn: plant.nameEn,
    price: plant.price,
    originalPrice: plant.originalPrice,
    image: plant.image,
    description: plant.description,
    descriptionEn: plant.descriptionEn,
    isAvailable: plant.isAvailable,
    isOnSale: plant.isOnSale,
    category: plant.category,
    careLevel: plant.careLevel,
    lightRequirement: plant.lightRequirement,
    wateringFrequency: plant.wateringFrequency,
    stock: plant.stock,
    tags: plant.tags,
    discountPercent: plant.discountPercent || 0,
    createdAt: plant.createdAt,
    updatedAt: plant.updatedAt
  };
};

export default mockPlantsData;
