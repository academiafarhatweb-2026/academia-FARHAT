const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const paymentController = require('../controllers/paymentController');
const { createPaymentValidators, updatePaymentValidators } = require('../validators/paymentValidators');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.post('/', createPaymentValidators, asyncHandler(paymentController.create));
router.get('/', asyncHandler(paymentController.list));
router.get('/enrollment/:enrollmentId', asyncHandler(paymentController.listByEnrollment));
router.get('/:id/receipt', asyncHandler(paymentController.getReceipt));
router.put('/:id', updatePaymentValidators, asyncHandler(paymentController.update));
router.delete('/:id', asyncHandler(paymentController.remove));

module.exports = router;
