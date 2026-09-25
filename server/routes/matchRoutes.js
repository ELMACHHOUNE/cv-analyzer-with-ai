import { Router } from 'express';
import { create, get, list, remove } from '../controllers/matchController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateIdParam, validateListQuery, validateMatchOptions } from '../utils/validators.js';

export const jobMatchRouter = Router();
jobMatchRouter.post(
  '/jobs/:jobId/match/:resumeId',
  authMiddleware,
  aiLimiter,
  validate((req) => ({
    params: {
      jobId: validateIdParam(req.params.jobId, 'jobId'),
      resumeId: validateIdParam(req.params.resumeId, 'resumeId')
    },
    body: validateMatchOptions(req.body, req.query)
  })),
  create
);

export const matchRouter = Router();
matchRouter.use(authMiddleware);
matchRouter.get('/', validate((req) => ({ query: validateListQuery(req.query, ['resumeId', 'jobId']) })), list);
matchRouter.get('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), get);
matchRouter.delete('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), remove);

export default matchRouter;
