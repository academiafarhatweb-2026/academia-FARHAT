import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as studentController from '../controllers/studentController.js';
import { studentValidators } from '../validators/studentValidators.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(studentController.list));
router.get('/:id', asyncHandler(studentController.getOne));
router.post('/', studentValidators, asyncHandler(studentController.create));
router.put('/:id', studentValidators, asyncHandler(studentController.update));
router.delete('/:id/permanent', asyncHandler(studentController.hardRemove));
router.delete('/:id', asyncHandler(studentController.remove));

export default router;
