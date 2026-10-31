import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from './asyncHandler.js';

// Wires standard list/getOne/create/update/remove handlers behind admin-only auth.
// `validators` optionally supplies { create: [...], update: [...] } express-validator
// chains (each ending in the shared `validate` middleware) to run before create/update.
export default function buildCrudRouter(controller, validators = {}) {
  const router = express.Router();
  router.use(requireAuth, requireRole('admin'));

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getOne));
  router.post('/', ...(validators.create || []), asyncHandler(controller.create));
  router.put('/:id', ...(validators.update || []), asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
