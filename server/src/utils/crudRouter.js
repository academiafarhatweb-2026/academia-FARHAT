const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('./asyncHandler');

// Wires standard list/getOne/create/update/remove handlers behind admin-only auth.
function buildCrudRouter(controller) {
  const router = express.Router();
  router.use(requireAuth, requireRole('admin'));

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getOne));
  router.post('/', asyncHandler(controller.create));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}

module.exports = buildCrudRouter;
