import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as enrollmentController from '../controllers/enrollmentController.js';
import {
  createEnrollmentValidators,
  updateEnrollmentValidators,
} from '../validators/enrollmentValidators.js';

const router = express.Router();
router.use(requireAuth);

router.get('/me', asyncHandler(enrollmentController.listMine));

router.use(requireRole('admin'));
router.get('/', asyncHandler(enrollmentController.list));
router.get('/:id', asyncHandler(enrollmentController.getOne));
router.post('/', createEnrollmentValidators, asyncHandler(enrollmentController.create));
router.put('/:id', updateEnrollmentValidators, asyncHandler(enrollmentController.update));
router.delete('/:id/permanent', asyncHandler(enrollmentController.hardRemove));
router.delete('/:id', asyncHandler(enrollmentController.remove));

export default router;
