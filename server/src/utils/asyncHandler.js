// Express 4 doesn't forward rejected promises to the error middleware on its own.
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
