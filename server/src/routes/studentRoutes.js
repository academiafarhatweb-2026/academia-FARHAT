const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const studentController = require('../controllers/studentController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(studentController.list));
router.get('/:id', asyncHandler(studentController.getOne));
router.post('/', asyncHandler(studentController.create));
router.put('/:id', asyncHandler(studentController.update));
router.delete('/:id/permanent', asyncHandler(studentController.hardRemove));
router.delete('/:id', asyncHandler(studentController.remove));

module.exports = router;
