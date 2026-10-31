import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as homeController from '../controllers/homeController.js';
import { homeContentValidators } from '../validators/homeValidators.js';

const router = express.Router();

router.get('/', asyncHandler(homeController.getContent));
router.put('/', requireAuth, requireRole('admin'), homeContentValidators, asyncHandler(homeController.updateContent));

export default router;
