const Teacher = require('../models/Teacher');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');

module.exports = buildCrudRouter(createCrudController(Teacher, ['rates.instrument']));
