import express from 'express';
import { login, studentLogin, logout, me } from '../controllers/authController.js';
import { attachUserIfPresent } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import asyncHandler from '../utils/asyncHandler.js';
import { adminLoginValidators, studentLoginValidators } from '../validators/authValidators.js';

const router = express.Router();

router.post('/login', loginLimiter, adminLoginValidators, asyncHandler(login));
router.post('/student-login', loginLimiter, studentLoginValidators, asyncHandler(studentLogin));
router.post('/logout', asyncHandler(logout));
router.get('/me', attachUserIfPresent, asyncHandler(me));

export default router;
