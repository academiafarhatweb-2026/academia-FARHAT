import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as settlementController from '../controllers/settlementController.js';
import {
  generateSettlementValidators,
  updateSettlementValidators,
} from '../validators/settlementValidators.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(settlementController.list));
router.get('/:id', asyncHandler(settlementController.getOne));
router.post('/generate', generateSettlementValidators, asyncHandler(settlementController.generate));
router.put('/:id', updateSettlementValidators, asyncHandler(settlementController.update));
router.delete('/:id', asyncHandler(settlementController.remove));

export default router;
