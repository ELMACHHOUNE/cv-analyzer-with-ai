import { Router } from 'express';
import { get, list, remove, update, upload } from '../controllers/resumeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateIdParam, validateListQuery, validateResumeName } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

router.post('/', uploadResume, upload);
router.post('/upload', uploadResume, upload);
router.get('/', validate((req) => ({ query: validateListQuery(req.query) })), list);
router.get('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), get);
router.patch('/:id', validate((req) => ({
  params: { id: validateIdParam(req.params.id) },
  body: validateResumeName(req.body, true)
})), update);
router.delete('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), remove);

export default router;
