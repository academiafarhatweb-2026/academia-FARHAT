const { validationResult } = require('express-validator');

// Runs after an express-validator chain: if any field failed, respond 400 with
// the first message (matches the flat { message } shape the rest of the API
// already uses) plus the full list for anyone who wants field-level detail.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array({ onlyFirstError: true });
  res.status(400).json({ message: errors[0].msg, errors });
}

module.exports = validate;
