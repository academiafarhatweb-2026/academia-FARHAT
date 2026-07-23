const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/', asyncHandler(homeController.getContent));
router.put('/', requireAuth, requireRole('admin'), asyncHandler(homeController.updateContent));

module.exports = router;
