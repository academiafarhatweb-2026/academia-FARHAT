import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as paymentController from '../controllers/paymentController.js';
import {
  createPaymentValidators,
  updatePaymentValidators,
} from '../validators/paymentValidators.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.post('/', createPaymentValidators, asyncHandler(paymentController.create));
router.get('/', asyncHandler(paymentController.list));
router.get('/enrollment/:enrollmentId', asyncHandler(paymentController.listByEnrollment));
router.get('/:id/receipt', asyncHandler(paymentController.getReceipt));
router.put('/:id', updatePaymentValidators, asyncHandler(paymentController.update));
router.delete('/:id', asyncHandler(paymentController.remove));

export default router;
