import express from 'express';
import {
  createPlant,
  deletePlant,
  getAllPlants,
  getFeaturedPlants,
  getPlantById,
  getPlantCategories,
  toggleAvailability,
  toggleSale,
  updatePlant
} from '../controllers/plantController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllPlants);                          // GET all plants with filtering/pagination
router.get('/categories', getPlantCategories);          // GET all plant categories
router.get('/featured', getFeaturedPlants);             // GET featured plants
router.get('/:id', getPlantById);                       // GET single plant by ID

// Protected routes (require authentication)
router.post('/', createPlant);                          // CREATE new plant
router.put('/:id', updatePlant);                        // UPDATE plant
router.delete('/:id', deletePlant);                     // DELETE plant (soft delete)
router.put('/:id/availability', toggleAvailability);    // TOGGLE plant availability
router.put('/:id/sale', toggleSale);                    // TOGGLE plant sale status

export default router;
