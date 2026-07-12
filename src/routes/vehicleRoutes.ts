import { Router } from 'express';
import {
  createVehicle,
  listVehicles,
  searchVehicles,
  updateVehicle,
  purchaseVehicle,
  restockVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// GET /api/vehicles/search - Search vehicles (Protected)
// Note: Mount search BEFORE the /:id routes so Express matches it first!
router.get('/search', authenticateJWT, searchVehicles);

// POST /api/vehicles - Add a new vehicle (Admin only)
router.post('/', authenticateJWT, requireAdmin, createVehicle);

// GET /api/vehicles - List all vehicles (Protected)
router.get('/', authenticateJWT, listVehicles);

// PUT /api/vehicles/:id - Update a vehicle (Admin only)
router.put('/:id', authenticateJWT, requireAdmin, updateVehicle);

// POST /api/vehicles/:id/purchase - Purchase a vehicle (Protected)
router.post('/:id/purchase', authenticateJWT, purchaseVehicle);

// POST /api/vehicles/:id/restock - Restock a vehicle (Admin only)
router.post('/:id/restock', authenticateJWT, requireAdmin, restockVehicle);

// DELETE /api/vehicles/:id - Delete a vehicle (Admin only)
router.delete('/:id', authenticateJWT, requireAdmin, deleteVehicle);

export default router;
