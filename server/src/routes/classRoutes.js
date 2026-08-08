const FixedClass = require('../models/FixedClass');
const createCrudController = require('../controllers/crudFactory');
const buildCrudRouter = require('../utils/crudRouter');
const { classValidators } = require('../validators/classValidators');

module.exports = buildCrudRouter(createCrudController(FixedClass, ['instrument', 'teacher']), {
  create: classValidators,
  update: classValidators,
});
