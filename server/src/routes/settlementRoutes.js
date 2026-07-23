const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const settlementController = require('../controllers/settlementController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(settlementController.list));
router.get('/:id', asyncHandler(settlementController.getOne));
router.post('/generate', asyncHandler(settlementController.generate));
router.put('/:id', asyncHandler(settlementController.update));

module.exports = router;
