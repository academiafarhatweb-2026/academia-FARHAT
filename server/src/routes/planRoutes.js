const Plan = require('../models/Plan');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');
const { planValidators } = require('../validators/planValidators');

module.exports = buildCrudRouter(createCrudController(Plan), { create: planValidators, update: planValidators });
