// Strips keys that start with "$" or contain "." from user input, so a body or
// query like { email: { "$ne": null } } can't turn into a MongoDB operator.
function stripOperators(value) {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else value[key] = stripOperators(value[key]);
    }
  }
  return value;
}

export default function sanitizeInput(req, res, next) {
  stripOperators(req.body);
  stripOperators(req.params);
  stripOperators(req.query);
  next();
}
