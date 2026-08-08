const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const settlementController = require('../controllers/settlementController');
const { generateSettlementValidators, updateSettlementValidators } = require('../validators/settlementValidators');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(settlementController.list));
router.get('/:id', asyncHandler(settlementController.getOne));
router.post('/generate', generateSettlementValidators, asyncHandler(settlementController.generate));
router.put('/:id', updateSettlementValidators, asyncHandler(settlementController.update));
router.delete('/:id', asyncHandler(settlementController.remove));

module.exports = router;
