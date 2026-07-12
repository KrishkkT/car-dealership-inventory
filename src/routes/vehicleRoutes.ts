import { Router } from 'express';
import { createVehicle } from '../controllers/vehicleController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// POST /api/vehicles - Admin only
router.post('/', authenticateJWT, requireAdmin, createVehicle);

export default router;
