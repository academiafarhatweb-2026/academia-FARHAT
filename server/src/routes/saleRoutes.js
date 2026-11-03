import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as saleController from '../controllers/saleController.js';
import { createSaleValidators, listSalesValidators, updateSaleValidators } from '../validators/saleValidators.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', listSalesValidators, asyncHandler(saleController.list));
router.post('/', createSaleValidators, asyncHandler(saleController.create));
router.put('/:id', updateSaleValidators, asyncHandler(saleController.update));
router.delete('/:id', asyncHandler(saleController.remove));

export default router;
