const Plan = require('../models/Plan');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');

module.exports = buildCrudRouter(createCrudController(Plan));
