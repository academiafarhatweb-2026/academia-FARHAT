const Instrument = require('../models/Instrument');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');

module.exports = buildCrudRouter(createCrudController(Instrument));
