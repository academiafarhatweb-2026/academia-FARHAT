const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const homeController = require('../controllers/homeController');
const { homeContentValidators } = require('../validators/homeValidators');

const router = express.Router();

router.get('/', asyncHandler(homeController.getContent));
router.put('/', requireAuth, requireRole('admin'), homeContentValidators, asyncHandler(homeController.updateContent));

module.exports = router;
