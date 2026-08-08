const express = require('express');
const { login, studentLogin, logout, me } = require('../controllers/authController');
const { attachUserIfPresent } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { adminLoginValidators, studentLoginValidators } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', adminLoginValidators, asyncHandler(login));
router.post('/student-login', studentLoginValidators, asyncHandler(studentLogin));
router.post('/logout', asyncHandler(logout));
router.get('/me', attachUserIfPresent, asyncHandler(me));

module.exports = router;
