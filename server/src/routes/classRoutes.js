const FixedClass = require('../models/FixedClass');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');

module.exports = buildCrudRouter(createCrudController(FixedClass, ['instrument', 'teacher']));
