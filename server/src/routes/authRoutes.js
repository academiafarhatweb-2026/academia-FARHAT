const express = require('express');
const { login, studentLogin, logout, me } = require('../controllers/authController');
const { attachUserIfPresent } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.post('/student-login', asyncHandler(studentLogin));
router.post('/logout', asyncHandler(logout));
router.get('/me', attachUserIfPresent, asyncHandler(me));

module.exports = router;
