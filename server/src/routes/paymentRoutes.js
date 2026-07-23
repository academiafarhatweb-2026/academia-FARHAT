const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const paymentController = require('../controllers/paymentController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.post('/', asyncHandler(paymentController.create));
router.get('/', asyncHandler(paymentController.list));
router.get('/enrollment/:enrollmentId', asyncHandler(paymentController.listByEnrollment));
router.put('/:id', asyncHandler(paymentController.update));
router.delete('/:id', asyncHandler(paymentController.remove));

module.exports = router;
