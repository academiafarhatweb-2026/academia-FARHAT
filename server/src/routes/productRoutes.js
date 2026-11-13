import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as productController from '../controllers/productController.js';
import {
  productValidators,
  adjustStockValidators,
  reorderProductsValidators,
} from '../validators/productValidators.js';

// Admin-only management. The public Home reads products through /api/home.
const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(productController.list));
router.get('/categories', asyncHandler(productController.listCategories));
router.put('/reorder', reorderProductsValidators, asyncHandler(productController.reorder));
router.get('/:id', asyncHandler(productController.getOne));
router.post('/', productValidators, asyncHandler(productController.create));
router.put('/:id', productValidators, asyncHandler(productController.update));
router.patch('/:id/stock', adjustStockValidators, asyncHandler(productController.adjustStock));
router.delete('/:id', asyncHandler(productController.remove));

export default router;
