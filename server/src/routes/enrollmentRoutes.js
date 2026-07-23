const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();
router.use(requireAuth);

router.get('/me', asyncHandler(enrollmentController.listMine));

router.use(requireRole('admin'));
router.get('/', asyncHandler(enrollmentController.list));
router.get('/:id', asyncHandler(enrollmentController.getOne));
router.post('/', asyncHandler(enrollmentController.create));
router.put('/:id', asyncHandler(enrollmentController.update));
router.delete('/:id/permanent', asyncHandler(enrollmentController.hardRemove));
router.delete('/:id', asyncHandler(enrollmentController.remove));

module.exports = router;
