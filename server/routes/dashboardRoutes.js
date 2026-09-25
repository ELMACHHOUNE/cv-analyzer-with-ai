import { Router } from 'express';
import { get } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', authMiddleware, get);
router.get('/stats', authMiddleware, get);
export default router;
