import { Router } from 'express';
import { changePassword, getSettings, updateSettings } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validatePasswordChange, validateSettings } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', getSettings);
router.patch('/', validate((req) => ({ body: validateSettings(req.body) })), updateSettings);
router.put('/password', validate((req) => ({ body: validatePasswordChange(req.body) })), changePassword);

export default router;
